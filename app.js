import { TOPICS, LANGUAGES, SOURCES, flatLabs, findLab, findTopic } from './curriculum.js';
import { getExample, getExercise } from './examples.js';
import { renderVisual, hydrateVisual } from './visuals.js';
import { runCode } from './runtime.js';
import { FINAL_QUIZ } from './quiz.js';

const STORE_KEY = 'swe-revision-labs:v3';
const app = document.querySelector('#app');
const allLabs = flatLabs();
let editor = null;
let monacoPromise = null;

const defaults = {
  language: 'typescript',
  currentLab: 'big-o',
  step: 0,
  comfortable: {},
  code: {},
  sessionMinutes: 20,
  quiz: { current: 0, answers: {}, completed: false, score: null },
};

let state = loadState();

function loadState() {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') }; }
  catch { return structuredClone(defaults); }
}
function saveState() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function h(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function completedCount() { return Object.values(state.comfortable).filter(Boolean).length; }
function pct(n,d) { return d ? Math.round((n/d)*100) : 0; }
function langLabel() { return LANGUAGES.find(l=>l.id===state.language)?.label || 'TypeScript'; }
function route() { const raw=location.hash.slice(1) || 'home'; const [view,arg]=raw.split('/'); return {view,arg}; }
function go(hash) { location.hash = hash; }
function currentLab() { return findLab(state.currentLab) || allLabs[0]; }
function topicProgress(topic) { const done=topic.labs.filter(l=>state.comfortable[l.id]).length; return {done,total:topic.labs.length,percent:pct(done,topic.labs.length)}; }
function nextLab(lab) { const i=allLabs.findIndex(x=>x.id===lab.id); return allLabs[i+1] || null; }

function brandSvg(){return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6.5h6l2 3h8M4 17.5h6l2-3h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="4" cy="6.5" r="2" fill="currentColor"/><circle cx="20" cy="9.5" r="2" fill="currentColor"/><circle cx="4" cy="17.5" r="2" fill="currentColor"/><circle cx="20" cy="14.5" r="2" fill="currentColor"/></svg>`}

function topbar() {
  return `<header class="topbar">
    <div class="brand" data-action="home"><div class="brand-mark">${brandSvg()}</div><div class="brand-copy"><strong>SWE Revision Labs</strong><span>15–30 minutes. One concept at a time.</span></div></div>
    <div class="topbar-actions">
      <button class="ghost-btn" data-action="command" title="Jump to a lab">⌘K&nbsp; Jump</button>
      <button class="ghost-btn" data-action="quiz">Final review</button>
    </div>
  </header>`;
}
function footer() { return `<footer class="footer"><span>SWE Revision Labs · local-first · no account required</span><span>Monaco 0.56 · TypeScript 6.0.3 runtime · Pyodide 0.29.5</span></footer>`; }

function homeView() {
  const done=completedCount();
  const lab=currentLab();
  const topic=findTopic(lab.topicId);
  const overall=pct(done,allLabs.length);
  return `${topbar()}<main class="shell">
    <div class="home-grid">
      <section class="hero-card">
        <div class="eyebrow">Daily software engineering revision</div>
        <h1 class="hero-title">One lab. One mental model. Then move on.</h1>
        <p class="hero-sub">Pick a topic and language, learn the concept visually, run code in the browser, and only mark it complete when you can explain the trade-offs without prompts.</p>
        <div class="hero-actions">
          <button class="primary-btn" data-open-lab="${h(lab.id)}">${done ? 'Continue' : 'Start'} · ${h(topic?.title || '')} / ${h(lab.title)}</button>
          <select id="session-minutes" class="select-control" style="width:auto" aria-label="Daily session length">
            ${[15,20,30].map(m=>`<option value="${m}" ${state.sessionMinutes===m?'selected':''}>${m} min/day</option>`).join('')}
          </select>
        </div>
        <div class="stats-row">
          <div class="stat"><strong>${done}/${allLabs.length}</strong><span>labs comfortable</span></div>
          <div class="stat"><strong>${overall}%</strong><span>curriculum confidence</span></div>
          <div class="stat"><strong>${langLabel()}</strong><span>current code language</span></div>
        </div>
      </section>
      <aside class="sidebar-card">
        <div class="eyebrow">Your path</div><h3 style="margin-top:10px">Progress is explicit, not inferred</h3>
        <p>A lab only turns green when you choose <strong>I’m comfortable</strong>. The Next button stays locked until then.</p>
        <div class="progress-track"><span style="width:${overall}%"></span></div>
        <p style="font-size:12px">${done===0?'Start anywhere. Complexity is the recommended first track.':`You’ve marked ${done} labs comfortable. Revisit any green lab whenever you want.`}</p>
        <button class="soft-btn wide" data-action="quiz">Open comprehensive final review</button>
      </aside>
    </div>

    <div class="section-head"><div><h2>Choose a topic</h2><p>Each topic is split into focused 15–30 minute labs.</p></div></div>
    <div class="topic-grid">
      ${TOPICS.map(topic=>{const p=topicProgress(topic);return `<article class="topic-card" data-topic="${topic.id}">
        <div class="topic-icon">${topic.icon}</div><h3>${h(topic.title)}</h3><p>${h(topic.description)}</p>
        <div class="topic-meta"><span>${p.done}/${p.total} comfortable</span><span>${p.percent}%</span></div>
        <div class="progress-track" style="margin:8px 0 0"><span style="width:${p.percent}%"></span></div>
      </article>`}).join('')}
    </div>
  </main>${footer()}`;
}

function sidebar(lab) {
  const topic=findTopic(lab.topicId);
  return `<aside class="lab-sidebar">
    <div class="sidebar-card compact">
      <label class="select-label">Topic</label>
      <select id="topic-select" class="select-control">${TOPICS.map(t=>`<option value="${t.id}" ${t.id===lab.topicId?'selected':''}>${h(t.title)}</option>`).join('')}</select>
      <label class="select-label" style="margin-top:12px">Subtopic</label>
      <select id="lab-select" class="select-control">${topic.labs.map(x=>`<option value="${x.id}" ${x.id===lab.id?'selected':''}>${h(x.title)}</option>`).join('')}</select>
      <label class="select-label" style="margin-top:12px">Programming language</label>
      <select id="lang-select" class="select-control">${LANGUAGES.map(x=>`<option value="${x.id}" ${x.id===state.language?'selected':''}>${x.label}</option>`).join('')}</select>
    </div>
    <div class="sidebar-card compact">
      <div class="eyebrow">${h(topic.title)}</div>
      <div class="lab-list">${topic.labs.map((x,i)=>`<button data-open-lab="${x.id}" class="${x.id===lab.id?'active':''}"><span class="lab-status-dot ${state.comfortable[x.id]?'done':''}"></span><span>${i+1}. ${h(x.title)}</span></button>`).join('')}</div>
    </div>
  </aside>`;
}

const steps=['Understand','Visualize','Code','Check'];
function stepper(lab) { return `<nav class="stepper">${steps.map((s,i)=>`<button class="step-btn ${state.step===i?'active':''} ${i<state.step?'done':''}" data-step="${i}">${i<state.step?'✓ ':''}${s}</button>`).join('')}</nav>`; }

function sourceLinks(lab) {
  const refs=(lab.sources||[]).map(id=>SOURCES[id]).filter(Boolean);
  if(!refs.length)return '';
  return `<div class="source-list">${refs.map(s=>`<a class="source-link" href="${s.url}" target="_blank" rel="noreferrer"><span>${h(s.name)}<small>${h(s.kind)}</small></span><span>↗</span></a>`).join('')}</div>`;
}

function understandStep(lab) {
  return `<div class="lesson-grid"><div>
    <section class="content-card"><div class="eyebrow">Mental model</div><h2 style="margin-top:10px">${h(lab.mentalModel || lab.summary)}</h2><p>${h(lab.summary)}</p>
      <div class="callout"><strong>Explain it clearly:</strong> ${h(lab.tradeoffs || 'State the assumption, the trade-off, and what would make you choose differently.')}</div>
    </section>
    <section class="content-card" style="margin-top:14px"><h3>What you should be able to do</h3><ul>${(lab.objectives||[]).map(x=>`<li>${h(x)}</li>`).join('')}</ul></section>
    <section class="content-card" style="margin-top:14px"><h3>Key ideas</h3><ul>${(lab.bullets||[]).map(x=>`<li>${h(x)}</li>`).join('')}</ul></section>
  </div><aside>
    <section class="content-card"><h3>Interview traps</h3>${(lab.traps||[]).map(([t,d])=>`<div class="trap-card" style="margin-top:9px"><strong>${h(t)}</strong><span>${h(d)}</span></div>`).join('')}</section>
    <section class="content-card" style="margin-top:14px"><h3>Trusted references</h3>${sourceLinks(lab)}</section>
  </aside></div>`;
}

function visualStep(lab) { return `<div class="lesson-grid"><section class="visual-shell" id="visual-root">${renderVisual(lab.visual)}</section><section class="content-card"><div class="eyebrow">Use the visual</div><h2 style="margin-top:10px">Explain what changes as load or state grows.</h2><p>Do not memorise the picture. Narrate it: identify the moving part, the invariant, the bottleneck, and the trade-off.</p><div class="callout"><strong>60-second drill:</strong> explain this diagram aloud without using the words “basically”, “just”, or “obviously”. Then name one situation where you would choose a different design.</div><div class="callout warn"><strong>Look beyond the diagram:</strong> state what the diagram deliberately leaves out—failure, data size, tail latency, trust boundaries, or operational cost.</div></section></div>`; }

function codeStep(lab) {
  const ex=getExample(lab.exampleKind,state.language);
  const exercise=getExercise(lab.exerciseKind,state.language);
  const key=`${lab.id}:${state.language}`;
  const saved=state.code[key] ?? exercise.starter;
  return `<div>
    ${ex?`<div class="code-compare"><section class="code-panel bad"><div class="code-panel-head"><span>Bad / risky</span><span>${langLabel()}</span></div><pre class="code">${h(ex.bad)}</pre></section><section class="code-panel good"><div class="code-panel-head"><span>Better</span><span>${langLabel()}</span></div><pre class="code">${h(ex.good)}</pre></section></div><div class="callout" style="margin-top:12px"><strong>Why:</strong> ${h(ex.why)}</div>`:''}
    <section class="content-card" style="margin-top:16px"><div class="eyebrow">Live lab</div><h3 style="margin-top:8px">${h(exercise.prompt)}</h3><p>The runtime is browser-only. JavaScript/TypeScript execute in a disposable Web Worker with a timeout; Python runs in a disposable Pyodide worker. Network APIs are disabled inside the exercise runtime.</p></section>
    <div class="editor-wrap" style="margin-top:12px"><div class="editor-main"><div class="editor-toolbar"><div class="editor-toolbar-left"><strong style="font-size:12px">scratch.${state.language==='python'?'py':state.language==='typescript'?'ts':'js'}</strong><span style="color:var(--muted);font-size:11px">${langLabel()}</span></div><div class="editor-toolbar-right"><button class="mini-btn" id="reset-code">Reset</button><button class="mini-btn" id="run-code">Run</button><button class="primary-btn" id="run-tests">Run checks</button></div></div><div class="editor-host" id="editor-host" data-code="${encodeURIComponent(saved)}"></div></div><aside class="terminal"><div class="terminal-head">Output</div><div class="terminal-output" id="terminal-output">Ready. Run your code when you want feedback.</div><div class="runtime-note">First Python run downloads Pyodide once. TypeScript is transpiled locally before execution.</div></aside></div>
  </div>`;
}

function checkStep(lab) {
  const checks=[
    `I can explain “${lab.title}” in plain English without reading notes.`,
    `I can identify at least one bad implementation or common trap and explain why it fails.`,
    `I can state the main trade-off and one condition that would change my design choice.`,
    `I can apply the idea in ${langLabel()} or explain why it is language-agnostic.`,
  ];
  return `<div class="lesson-grid"><section class="content-card"><div class="eyebrow">Recall, don’t reread</div><h2 style="margin-top:10px">Can you do these from memory?</h2><div class="check-list">${checks.map((x,i)=>`<label class="check-item" style="display:flex;gap:12px;align-items:flex-start"><input type="checkbox" class="self-check" data-i="${i}" style="margin-top:4px"><span>${h(x)}</span></label>`).join('')}</div><div class="callout warn"><strong>Do not mark comfortable because the page feels familiar.</strong> Mark it when you can reproduce the mental model and defend a trade-off without looking.</div></section><aside class="content-card"><h3>Interview answer frame</h3><ol style="color:#b9c6d9;line-height:1.8;padding-left:22px"><li>Define the inputs / constraints.</li><li>Name the mechanism or invariant.</li><li>State time, space, consistency, or failure properties precisely.</li><li>Name the important assumption.</li><li>Give the trade-off and alternative.</li></ol><div class="callout"><strong>Your one-line summary:</strong><br>${h(lab.tradeoffs || lab.summary)}</div></aside></div>`;
}

function labView(lab) {
  const topic=findTopic(lab.topicId); const comfortable=!!state.comfortable[lab.id]; const next=nextLab(lab);
  const stepContent=[understandStep,visualStep,codeStep,checkStep][state.step](lab);
  return `${topbar()}<main class="shell"><div class="lab-layout">${sidebar(lab)}<section class="lab-stage">
    <header class="lab-header"><div class="lab-breadcrumb">${h(topic.title)} · Lab ${topic.labs.findIndex(x=>x.id===lab.id)+1} of ${topic.labs.length}</div><div class="lab-title-row"><div><h1>${h(lab.title)}</h1><p>${h(lab.summary)}</p></div><span class="lab-pill">≈ ${lab.minutes || 20} min · ${h(lab.difficulty || 'Advanced')}</span></div></header>
    ${stepper(lab)}<div class="stage-body">${stepContent}</div>
    <footer class="lab-footer"><div class="comfort"><button class="comfort-check ${comfortable?'on':''}" data-action="comfortable">${comfortable?'✓':'○'}</button><span>${comfortable?'Comfortable — revisit any time':'Not marked comfortable yet'}</span></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="ghost-btn" data-action="prev-step" ${state.step===0?'disabled':''}>← Previous</button>${state.step<3?`<button class="primary-btn" data-action="next-step">Next step →</button>`:`<button class="primary-btn" data-action="complete-next" ${comfortable?'':'disabled'}>${next?'Next lab →':'Curriculum complete →'}</button>`}</div></footer>
  </section></div></main>${footer()}`;
}

function quizView() {
  const qstate=state.quiz || defaults.quiz; const idx=Math.min(qstate.current || 0, FINAL_QUIZ.length-1); const q=FINAL_QUIZ[idx]; const answered=Object.keys(qstate.answers||{}).length;
  if(qstate.completed) return quizResults();
  return `${topbar()}<main class="shell"><div class="quiz-layout"><section class="quiz-card"><div class="eyebrow">Comprehensive final review</div><div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><h2 style="margin:10px 0 0">Question ${idx+1} of ${FINAL_QUIZ.length}</h2><span class="lab-pill">${h(findTopic(q.topic)?.title || q.topic)}</span></div><div class="quiz-question">${h(q.question)}</div><div class="quiz-options">${q.options.map((o,i)=>`<button class="quiz-option ${qstate.answers[idx]===i?'selected':''}" data-quiz-answer="${i}">${String.fromCharCode(65+i)}. ${h(o)}</button>`).join('')}</div><div class="quiz-nav"><button class="ghost-btn" data-quiz-nav="${idx-1}" ${idx===0?'disabled':''}>← Previous</button>${idx===FINAL_QUIZ.length-1?`<button class="primary-btn" data-action="submit-quiz" ${answered<FINAL_QUIZ.length?'disabled':''}>Finish & score</button>`:`<button class="primary-btn" data-quiz-nav="${idx+1}">Next →</button>`}</div></section><aside class="sidebar-card"><h3>Progress</h3><p>${answered}/${FINAL_QUIZ.length} answered. Your answers are saved locally.</p><div class="progress-track"><span style="width:${pct(answered,FINAL_QUIZ.length)}%"></span></div><div class="question-map">${FINAL_QUIZ.map((_,i)=>`<button class="question-dot ${qstate.answers[i]!==undefined?'answered':''} ${i===idx?'active':''}" data-quiz-nav="${i}">${i+1}</button>`).join('')}</div><div class="callout" style="margin-top:14px">This is a fixed 48-question bank: four questions across each of the 12 core SWE domains.</div><button class="danger-btn" data-action="reset-quiz">Reset final review</button></aside></div></main>${footer()}`;
}

function quizResults() {
  const answers=state.quiz.answers||{}; let correct=0; const byTopic={};
  FINAL_QUIZ.forEach((q,i)=>{const ok=answers[i]===q.answer; if(ok)correct++; byTopic[q.topic]??={correct:0,total:0}; byTopic[q.topic].total++; if(ok)byTopic[q.topic].correct++;});
  const score=pct(correct,FINAL_QUIZ.length);
  return `${topbar()}<main class="shell"><section class="hero-card"><div class="eyebrow">Final review complete</div><h1 class="hero-title">${score}%</h1><p class="hero-sub">${correct} of ${FINAL_QUIZ.length} correct. Use the domain breakdown to decide what to revisit; this score is revision evidence, not a hiring verdict.</p><div class="hero-actions"><button class="primary-btn" data-action="reset-quiz">Retake fixed review</button><button class="ghost-btn" data-action="home">Back to labs</button></div></section><div class="section-head"><div><h2>Domain breakdown</h2><p>Open weak domains from the home screen and mark labs comfortable only after recall improves.</p></div></div><div class="topic-grid">${TOPICS.map(t=>{const b=byTopic[t.id]||{correct:0,total:0};return `<article class="topic-card" data-topic="${t.id}"><div class="topic-icon">${t.icon}</div><h3>${h(t.title)}</h3><p>${b.correct}/${b.total} correct</p><div class="progress-track"><span style="width:${pct(b.correct,b.total)}%"></span></div></article>`}).join('')}</div><div class="section-head"><div><h2>Review answers</h2></div></div><div style="display:grid;gap:10px">${FINAL_QUIZ.map((q,i)=>{const ok=answers[i]===q.answer;return `<section class="content-card"><div class="eyebrow" style="color:${ok?'var(--good)':'var(--bad)'}">${ok?'Correct':'Revisit'} · ${h(findTopic(q.topic)?.title||q.topic)}</div><h3 style="margin-top:8px">${h(q.question)}</h3><p><strong>Your answer:</strong> ${h(q.options[answers[i]] ?? 'No answer')}<br><strong>Best answer:</strong> ${h(q.options[q.answer])}</p><div class="callout">${h(q.explanation)}</div></section>`}).join('')}</div></main>${footer()}`;
}

function render() {
  disposeEditor();
  const r=route();
  if(r.view==='lab') { const lab=findLab(r.arg)||currentLab(); state.currentLab=lab.id; saveState(); app.innerHTML=labView(lab); hydrateAfterRender(lab); }
  else if(r.view==='quiz') { app.innerHTML=quizView(); hydrateCommon(); }
  else { app.innerHTML=homeView(); hydrateCommon(); }
}

function hydrateCommon() {
  app.querySelectorAll('[data-action="home"]').forEach(el=>el.onclick=()=>go('home'));
  app.querySelectorAll('[data-action="quiz"]').forEach(el=>el.onclick=()=>go('quiz'));
  app.querySelectorAll('[data-action="command"]').forEach(el=>el.onclick=openCommand);
  app.querySelectorAll('[data-open-lab]').forEach(el=>el.onclick=()=>{state.currentLab=el.dataset.openLab;state.step=0;saveState();go(`lab/${el.dataset.openLab}`)});
  app.querySelectorAll('[data-topic]').forEach(el=>el.onclick=()=>{const t=findTopic(el.dataset.topic);if(t?.labs[0]){state.currentLab=t.labs[0].id;state.step=0;saveState();go(`lab/${t.labs[0].id}`)}});
  app.querySelector('#session-minutes')?.addEventListener('change',e=>{state.sessionMinutes=Number(e.target.value);saveState()});
  app.querySelectorAll('[data-quiz-nav]').forEach(el=>el.onclick=()=>{state.quiz.current=Number(el.dataset.quizNav);saveState();render()});
  app.querySelectorAll('[data-quiz-answer]').forEach(el=>el.onclick=()=>{state.quiz.answers[state.quiz.current]=Number(el.dataset.quizAnswer);saveState();render()});
  app.querySelectorAll('[data-action="reset-quiz"]').forEach(el=>el.onclick=()=>{state.quiz={current:0,answers:{},completed:false,score:null};saveState();render()});
  app.querySelector('[data-action="submit-quiz"]')?.addEventListener('click',()=>{const answers=state.quiz.answers;let c=0;FINAL_QUIZ.forEach((q,i)=>{if(answers[i]===q.answer)c++});state.quiz.completed=true;state.quiz.score=pct(c,FINAL_QUIZ.length);saveState();render()});
}

function hydrateAfterRender(lab) {
  hydrateCommon();
  const topicSelect=app.querySelector('#topic-select');
  if(topicSelect) topicSelect.onchange=()=>{const t=findTopic(topicSelect.value);if(t?.labs[0]){state.currentLab=t.labs[0].id;state.step=0;saveState();go(`lab/${t.labs[0].id}`)}};
  const labSelect=app.querySelector('#lab-select'); if(labSelect) labSelect.onchange=()=>{state.currentLab=labSelect.value;state.step=0;saveState();go(`lab/${labSelect.value}`)};
  const langSelect=app.querySelector('#lang-select'); if(langSelect) langSelect.onchange=()=>{state.language=langSelect.value;saveState();render()};
  app.querySelectorAll('[data-step]').forEach(el=>el.onclick=()=>{state.step=Number(el.dataset.step);saveState();render()});
  app.querySelector('[data-action="next-step"]')?.addEventListener('click',()=>{state.step=Math.min(3,state.step+1);saveState();render()});
  app.querySelector('[data-action="prev-step"]')?.addEventListener('click',()=>{state.step=Math.max(0,state.step-1);saveState();render()});
  app.querySelector('[data-action="comfortable"]')?.addEventListener('click',()=>{state.comfortable[lab.id]=!state.comfortable[lab.id];saveState();render()});
  app.querySelector('[data-action="complete-next"]')?.addEventListener('click',()=>{if(!state.comfortable[lab.id])return;const n=nextLab(lab);if(n){state.currentLab=n.id;state.step=0;saveState();go(`lab/${n.id}`)}else go('quiz')});
  if(state.step===1) hydrateVisual(app.querySelector('#visual-root'),lab.visual);
  if(state.step===2) hydrateEditor(lab);
}

function ensureMonaco() {
  if(window.monaco) return Promise.resolve(window.monaco);
  if(monacoPromise) return monacoPromise;
  monacoPromise=new Promise((resolve,reject)=>{
    if(!window.require){reject(new Error('Monaco loader unavailable'));return;}
    window.MonacoEnvironment={ getWorkerUrl:()=>`data:text/javascript;charset=utf-8,${encodeURIComponent(`self.MonacoEnvironment={baseUrl:'https://cdn.jsdelivr.net/npm/monaco-editor@0.56.0/min/'};importScripts('https://cdn.jsdelivr.net/npm/monaco-editor@0.56.0/min/vs/base/worker/workerMain.js');`)}` };
    window.require.config({paths:{vs:'https://cdn.jsdelivr.net/npm/monaco-editor@0.56.0/min/vs'}});
    window.require(['vs/editor/editor.main'],()=>resolve(window.monaco),reject);
  });
  return monacoPromise;
}

function disposeEditor(){ if(editor){try{editor.dispose()}catch{} editor=null;} document.querySelectorAll('[data-timer]').forEach(el=>{try{clearInterval(Number(el.dataset.timer))}catch{}}); }

async function hydrateEditor(lab) {
  const host=app.querySelector('#editor-host'); if(!host)return;
  const exercise=getExercise(lab.exerciseKind,state.language); const key=`${lab.id}:${state.language}`; let value=decodeURIComponent(host.dataset.code||'');
  try {
    const monaco=await ensureMonaco(); if(!document.body.contains(host))return;
    editor=monaco.editor.create(host,{value,language:state.language==='python'?'python':state.language==='typescript'?'typescript':'javascript',theme:'vs-dark',fontSize:13,lineHeight:22,minimap:{enabled:false},automaticLayout:true,scrollBeyondLastLine:false,padding:{top:14,bottom:14},fontLigatures:true});
    editor.onDidChangeModelContent(()=>{state.code[key]=editor.getValue();saveState()});
  } catch {
    host.innerHTML=`<textarea class="editor-fallback">${h(value)}</textarea>`; const ta=host.querySelector('textarea'); ta.oninput=()=>{state.code[key]=ta.value;saveState()};
  }
  const getValue=()=>editor?.getValue() ?? host.querySelector('textarea')?.value ?? value;
  const terminal=app.querySelector('#terminal-output');
  const execute=async(tests)=>{terminal.innerHTML='Running…';const result=await runCode(state.language,getValue(),tests);terminal.innerHTML=`<span class="${result.ok?'ok':'err'}">${h(result.ok?'PASS':'ERROR')}</span>\n${h(result.output||'')}${result.error?'\n'+h(result.error):''}`};
  app.querySelector('#run-code').onclick=()=>execute('');
  app.querySelector('#run-tests').onclick=()=>execute(exercise.tests||'');
  app.querySelector('#reset-code').onclick=()=>{state.code[key]=exercise.starter;saveState();if(editor)editor.setValue(exercise.starter);else if(host.querySelector('textarea'))host.querySelector('textarea').value=exercise.starter;terminal.textContent='Reset to starter code.'};
}

function openCommand() {
  if(document.querySelector('.command-overlay'))return;
  const wrap=document.createElement('div');wrap.className='command-overlay';wrap.innerHTML=`<div class="command-box"><input class="command-input" placeholder="Jump to a topic or lab…" autofocus><div class="command-results"></div></div>`;document.body.appendChild(wrap);
  const input=wrap.querySelector('input'), results=wrap.querySelector('.command-results');
  const draw=()=>{const q=input.value.trim().toLowerCase();const matches=allLabs.filter(l=>!q||`${l.topicTitle} ${l.title} ${l.summary}`.toLowerCase().includes(q)).slice(0,14);results.innerHTML=matches.map(l=>`<button class="command-result" data-id="${l.id}">${h(l.title)}<small>${h(l.topicTitle)} · ${l.minutes||20} min</small></button>`).join('');results.querySelectorAll('button').forEach(b=>b.onclick=()=>{wrap.remove();state.currentLab=b.dataset.id;state.step=0;saveState();go(`lab/${b.dataset.id}`)})};
  input.addEventListener('input',draw);wrap.addEventListener('click',e=>{if(e.target===wrap)wrap.remove()});input.focus();draw();
}

window.addEventListener('hashchange',render);
window.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommand()}if(e.key==='Escape')document.querySelector('.command-overlay')?.remove()});
if(!location.hash) location.hash='home'; else render();

if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
