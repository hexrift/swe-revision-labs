const JS_TIMEOUT_MS = 5000;
const PY_TIMEOUT_MS = 8000;

function jsWorkerSource() {
  return `
    const blocked = () => Promise.reject(new Error('Network access is disabled in the lab runtime.'));
    self.fetch = blocked;
    self.XMLHttpRequest = undefined;
    self.WebSocket = undefined;
    const format = (v) => {
      if (typeof v === 'string') return v;
      try { return JSON.stringify(v, null, 2); } catch { return String(v); }
    };
    self.onmessage = async (event) => {
      const { code } = event.data;
      const lines = [];
      const console = {
        log: (...args) => lines.push(args.map(format).join(' ')),
        info: (...args) => lines.push(args.map(format).join(' ')),
        warn: (...args) => lines.push('WARN ' + args.map(format).join(' ')),
        error: (...args) => lines.push('ERR ' + args.map(format).join(' ')),
      };
      try {
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        await new AsyncFunction('console', 'fetch', code)(console, blocked);
        self.postMessage({ ok: true, output: lines.join('\\n') || '✓ Program completed with no output.' });
      } catch (error) {
        self.postMessage({ ok: false, output: lines.join('\\n'), error: error?.stack || String(error) });
      }
    };
  `;
}

function pythonWorkerSource() {
  return `
    let pyodidePromise;
    async function getPyodide() {
      if (!pyodidePromise) {
        pyodidePromise = (async () => {
          importScripts('https://cdn.jsdelivr.net/pyodide/v0.29.5/full/pyodide.js');
          const py = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.5/full/' });
          self.fetch = () => Promise.reject(new Error('Network access is disabled in the lab runtime.'));
          return py;
        })();
      }
      return pyodidePromise;
    }
    self.onmessage = async (event) => {
      const { code } = event.data;
      const lines = [];
      try {
        const py = await getPyodide();
        py.setStdout({ batched: (s) => lines.push(s) });
        py.setStderr({ batched: (s) => lines.push('ERR ' + s) });
        const result = await py.runPythonAsync(code);
        if (result !== undefined && result !== null && String(result) !== 'undefined') lines.push(String(result));
        self.postMessage({ ok: true, output: lines.join('\\n') || '✓ Program completed with no output.' });
      } catch (error) {
        self.postMessage({ ok: false, output: lines.join('\\n'), error: error?.stack || String(error) });
      }
    };
  `;
}

function runWorker(source, code, timeoutMs) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    const worker = new Worker(url);
    const timer = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ ok:false, output:'', error:`Execution stopped after ${timeoutMs / 1000}s. Check for an infinite loop or unexpectedly expensive work.` });
    }, timeoutMs);
    worker.onmessage = (event) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(event.data);
    };
    worker.onerror = (event) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ ok:false, output:'', error:event.message || 'Worker execution failed.' });
    };
    worker.postMessage({ code });
  });
}

export async function runCode(language, source, tests = '', options = {}) {
  const mode = options.mode || (tests.trim() ? 'checks' : 'run');
  const checkMode = mode === 'checks';
  const CHECK_SENTINEL = '__SWE_REVISION_CHECKS_COMPLETED__';

  if (checkMode && !tests.trim()) {
    return { ok:false, output:'', error:'No correctness checks are configured for this exercise.' };
  }

  if (language === 'python') {
    const combined = checkMode
      ? `${source}\n\n${tests}\nprint("${CHECK_SENTINEL}")`
      : source;
    const result = await runWorker(pythonWorkerSource(), combined, PY_TIMEOUT_MS);
    if (!checkMode) {
      if (result.ok && result.output === '✓ Program completed with no output.') {
        result.output = 'Program completed. No correctness checks were run.';
      }
      return result;
    }
    if (!result.ok) return result;
    const lines = String(result.output || '').split('\n');
    const sentinelIndex = lines.lastIndexOf(CHECK_SENTINEL);
    if (sentinelIndex === -1) {
      return { ok:false, output:result.output || '', error:'The correctness checks did not complete.' };
    }
    lines.splice(sentinelIndex, 1);
    return { ok:true, output:lines.join('\n').trim() || 'All configured checks completed successfully.' };
  }

  let js = source;
  if (language === 'typescript') {
    if (!window.ts?.transpileModule) return { ok:false, output:'', error:'TypeScript compiler failed to load. Check your network connection and reload.' };
    try {
      js = window.ts.transpileModule(source, {
        compilerOptions: {
          target: window.ts.ScriptTarget.ES2022,
          module: window.ts.ModuleKind.None,
          strict: true,
        },
      }).outputText;
    } catch (error) {
      return { ok:false, output:'', error:String(error) };
    }
  }

  let compiledTests = tests;
  if (language === 'typescript' && tests) {
    compiledTests = window.ts.transpileModule(tests, {
      compilerOptions: { target: window.ts.ScriptTarget.ES2022, module: window.ts.ModuleKind.None },
    }).outputText;
  }

  if (!checkMode) {
    const result = await runWorker(jsWorkerSource(), js, JS_TIMEOUT_MS);
    if (result.ok && result.output === '✓ Program completed with no output.') {
      result.output = 'Program completed. No correctness checks were run.';
    }
    return result;
  }

  const combined = `${js}\n\n${compiledTests}\nconsole.log('${CHECK_SENTINEL}');`;
  const result = await runWorker(jsWorkerSource(), combined, JS_TIMEOUT_MS);
  if (!result.ok) return result;
  const lines = String(result.output || '').split('\n');
  const sentinelIndex = lines.lastIndexOf(CHECK_SENTINEL);
  if (sentinelIndex === -1) {
    return { ok:false, output:result.output || '', error:'The correctness checks did not complete.' };
  }
  lines.splice(sentinelIndex, 1);
  return { ok:true, output:lines.join('\n').trim() || 'All configured checks completed successfully.' };
}
