import assert from 'node:assert/strict';
import { domSource, workerSource } from './runner.js';

const worker=workerSource();
assert.doesNotThrow(()=>new Function(worker),'generated worker source must be valid JavaScript');
assert.match(worker,/new AsyncFunction\('\"use strict\";\\n'\+code\)/,'worker must preserve the generated function newline');

const dom=domSource('document.body.innerHTML="</script>";\nconst broken=(','test-token');
assert.match(dom,/script-src 'unsafe-inline' 'unsafe-eval'/,'sandbox CSP must allow runtime compilation of user code');
assert.match(dom,/new AsyncFunction\(/,'DOM runner must compile user code at runtime so syntax errors are caught and reported');
assert.match(dom,/token="test-token"/,'DOM source should carry its message token');
assert.ok(dom.includes('<\\/script>'),'user code/script boundaries must remain safe inside srcdoc');
assert.doesNotMatch(dom,/cancelAnimationFrame|clearUserScheduling/,'sandbox must not cancel user timers or animation frames after a run');
assert.match(dom,/const nativeSetTimeout=window\.setTimeout\.bind\(window\)/,'harness-internal waits must use a captured setTimeout so user code overwriting window.setTimeout cannot stall the run');
assert.doesNotMatch(dom,/window\.setTimeout=/,'sandbox must not replace the user-visible timer APIs');
const domScript=dom.match(/<script>([\s\S]*)<\/script>/)?.[1];
assert.ok(domScript,'DOM source should contain one executable script');
assert.doesNotThrow(()=>new Function(domScript),'generated DOM source must stay valid JavaScript even when user code has a syntax error');
console.log('Runner contracts passed.');
