import { TOPICS, LESSONS, getLesson, getTopic, lessonsFor, sourceName } from './curriculum.js';
import { createDefaultState, normalizeState, reduceState, countComfortable } from './state-model.js';
import { runWorkerCode, runDomExample, nodeProbeFor } from './runner.js';
import { renderBrowserMetrics, renderNodeMetrics } from './resource-visuals.js';

const root=document.querySelector('#app');
const STORE='swe-revision-labs:javascript-v3';
const CTX={lessons:LESSONS,topics:TOPICS};
let state=loadState();
let running=false;

function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function loadState(){
  try{return normalizeState(JSON.parse(localStorage.getItem(STORE)||'{}'),LESSONS,TOPICS)}
  catch{return createDefaultState(LESSONS,TOPICS)}
}
function saveState(){
  try{localStorage.setItem(STORE,JSON.stringify(state))}catch(error){console.warn('State persistence failed',error)}
}
function dispatch(action,{render=true}={}){
  state=normalizeState(reduceState(state,action,CTX),LESSONS,TOPICS);
  saveState();
  if(render) renderApp();
}
function route(){
  const raw=location.hash.slice(1)||'home';
  const [view,id]=raw.split('/');
  return {view,id};
}
function navigate(path){
  closeDrawer();
  const target='#'+path;
  if(location.hash===target) renderApp(); else location.hash=path;
}
function currentLesson(){return getLesson(state.current)||LESSONS[0]}
function currentCode(lesson){return state.code[lesson.id]??lesson.code}
function firstIncomplete(){return LESSONS.find(x=>!state.comfortable[x.id])||LESSONS[0]}
function resumeLesson(){const current=getLesson(state.current);return current&&!state.comfortable[current.id]?current:firstIncomplete()}
function percent(a,b){return b?Math.round(a/b*100):0}
function topicProgress(topic){const items=lessonsFor(topic.id);const done=items.filter(x=>state.comfortable[x.id]).length;return {done,total:items.length,percent:percent(done,items.length)}}
function nextLesson(lesson){const i=LESSONS.findIndex(x=>x.id===lesson.id);return LESSONS[i+1]||null}
function sourceDomain(url){try{return new URL(url).hostname.replace(/^www\./,'')}catch{return''}}

function icon(){return `<span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>`}
function drawer(){
  return `<div class="drawer-backdrop" data-drawer-backdrop></div><aside class="drawer" data-drawer aria-hidden="true">
    <div class="drawer-head"><div><p class="eyebrow">SWE Revision Labs</p><h2>JavaScript index</h2></div><button data-drawer-close class="icon-button" aria-label="Close menu">×</button></div>
    <nav class="drawer-nav">
      <button data-nav="home"><span>01</span><b>Learn</b><small>Continue your current concept</small><em>→</em></button>
      <button data-nav="index"><span>02</span><b>Full index</b><small>${LESSONS.length} lessons · searchable</small><em>→</em></button>
    </nav>
    <div class="drawer-topics"><p class="eyebrow">Topics</p>${TOPICS.map(topic=>`<button data-topic="${topic.id}">${escapeHtml(topic.title)}<span>${lessonsFor(topic.id).length}</span></button>`).join('')}</div>
  </aside>`;
}
function chrome(content){
  return `<div class="site"><header class="topbar"><button class="brand" data-nav="home">${icon()}<span>SWE Revision Labs</span></button><button class="menu-button" data-drawer-open aria-label="Open menu"><span></span><span></span><span></span></button></header>${content}${drawer()}</div>`;
}

function homeView(){
  const done=countComfortable(state,LESSONS);
  const resume=resumeLesson();
  const topicCards=TOPICS.map(topic=>{const p=topicProgress(topic);return `<button class="topic-card" data-topic="${topic.id}"><span class="topic-count">${String(TOPICS.indexOf(topic)+1).padStart(2,'0')}</span><span class="topic-copy"><strong>${escapeHtml(topic.title)}</strong><small>${escapeHtml(topic.description)}</small></span><span class="topic-progress">${p.done}/${p.total}</span></button>`}).join('');
  return chrome(`<main class="page home-page">
    <section class="hero reveal"><p class="eyebrow">JavaScript · browser + Node.js</p><h1>Understand the language.<br>Then understand the machine.</h1><p class="lead">From primitives and closures to the browser render pipeline, Node's event loop, heap pressure, buffers, streams and OS resources. Every lesson is sourced only from MDN or the official Node.js docs.</p>
      <div class="progress-block"><div><span>Comfortable</span><strong>${done}/${LESSONS.length}</strong></div><div class="progress-line"><i style="width:${percent(done,LESSONS.length)}%"></i></div></div>
    </section>
    <section class="continue-card reveal delay-1"><div><span class="tag">Continue</span><h2>${escapeHtml(resume.title)}</h2><p>${escapeHtml(getTopic(resume.topic)?.title||'')} · ${sourceName(resume.source)}</p></div><div class="continue-flow"><span>concept</span><b>→</b><span>code</span><b>→</b><span>run</span><b>→</b><span>machine</span></div><button class="primary" data-lesson="${resume.id}">Open lesson</button></section>
    <section class="section reveal delay-2"><div class="section-head"><div><p class="eyebrow">Curriculum</p><h2>Pick one topic</h2></div><button class="text-button" data-nav="index">Full index →</button></div><div class="topic-grid">${topicCards}</div></section>
    <section class="host-compare reveal delay-3"><article><p class="eyebrow">Client</p><h3>Browser host</h3><p>JavaScript engine plus DOM, events, rendering, fetch, storage, workers and WebSocket.</p><div class="mini-machine"><span>JS</span><b>+</b><span>Web APIs</span><b>+</b><span>renderer</span></div></article><article><p class="eyebrow">Backend</p><h3>Node.js host</h3><p>JavaScript engine plus process, filesystem, network, buffers, streams, libuv and OS resources.</p><div class="mini-machine"><span>JS</span><b>+</b><span>Node</span><b>+</b><span>OS</span></div></article></section>
  </main>`);
}

function filteredLessons(){
  const query=state.search.trim().toLowerCase();
  return LESSONS.filter(lesson=>{
    if(state.topic && lesson.topic!==state.topic) return false;
    if(!query) return true;
    const text=`${lesson.title} ${lesson.summary} ${getTopic(lesson.topic)?.title||''}`.toLowerCase();
    return text.includes(query);
  });
}
function indexRows(items){
  return items.map((lesson,index)=>`<button class="lesson-row" data-lesson="${lesson.id}" data-search-text="${escapeHtml((lesson.title+' '+lesson.summary).toLowerCase())}"><span class="row-index">${String(index+1).padStart(2,'0')}</span><span><strong>${escapeHtml(lesson.title)}</strong><small>${escapeHtml(sourceName(lesson.source))} · ${escapeHtml(sourceDomain(lesson.source))}</small></span><em class="done-dot ${state.comfortable[lesson.id]?'done':''}">${state.comfortable[lesson.id]?'✓':''}</em></button>`).join('');
}
function indexView(){
  const selected=getTopic(state.topic)||TOPICS[0];
  const items=filteredLessons();
  return chrome(`<main class="page index-page"><section class="index-head reveal"><p class="eyebrow">Complete JavaScript index</p><h1>${LESSONS.length} lessons</h1><p class="lead">Search by concept or work topic-by-topic. Every example carries its exact MDN or Node.js source.</p><label class="search"><span>⌕</span><input data-search value="${escapeHtml(state.search)}" placeholder="closures, heap, fetch, streams…" autocomplete="off"></label></section>
    <div class="topic-scroller reveal delay-1"><button class="chip ${state.topic===''?'active':''}" data-topic="">All</button>${TOPICS.map(topic=>`<button class="chip ${state.topic===topic.id?'active':''}" data-topic="${topic.id}">${escapeHtml(topic.title)}</button>`).join('')}</div>
    <section class="index-list reveal delay-2"><div class="list-head"><strong>${state.topic?escapeHtml(selected.title):'All topics'}</strong><span data-result-count>${items.length} lessons</span></div><div data-index-rows>${indexRows(items)}</div></section>
  </main>`);
}

function compareCard(kind,code,source){return `<article class="compare-card ${kind}"><header><span>${kind==='poor'?'Poor / risky':'Better / clearer'}</span><a href="${source}" target="_blank" rel="noreferrer">reference ↗</a></header><pre><code>${escapeHtml(code)}</code></pre></article>`}
function tips(lesson){return `<div class="insight-grid"><article><p class="eyebrow">Traps</p><ul>${lesson.traps.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></article><article><p class="eyebrow">Useful tips</p><ul>${lesson.tips.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></article></div>`}
function debugBlock(lesson){
  if(!lesson.debug) return '';
  const progress=state.debug[lesson.id]||{answer:null,revealed:false};
  const selected=progress.answer;
  const revealed=progress.revealed;
  return `<section class="debug-card reveal delay-2"><div class="debug-head"><div><p class="eyebrow">Advanced debugging lab</p><h2>${escapeHtml(lesson.debug.symptom)}</h2></div><span>${revealed?'analysis revealed':'diagnose first'}</span></div>
    <pre class="debug-code"><code>${escapeHtml(lesson.compare.bad)}</code></pre>
    <div class="debug-question"><p>${escapeHtml(lesson.debug.question)}</p><div class="debug-options">${lesson.debug.options.map((option,index)=>`<button data-debug-answer="${index}" class="${selected===index?'selected':''} ${revealed?(index===lesson.debug.answer?'correct':selected===index?'wrong':''):''}"><span>${String.fromCharCode(65+index)}</span>${escapeHtml(option)}</button>`).join('')}</div></div>
    <div class="debug-actions"><button class="secondary" data-debug-reveal ${selected===null?'disabled':''}>${revealed?'Analysis revealed':'Reveal diagnosis'}</button></div>
    ${revealed?`<div class="debug-analysis"><article><p class="eyebrow">Next thing to inspect</p><p>${escapeHtml(lesson.debug.next)}</p></article><article><p class="eyebrow">Root cause</p><p>${escapeHtml(lesson.debug.root)}</p></article><article><p class="eyebrow">Fix</p><pre><code>${escapeHtml(lesson.debug.fix)}</code></pre></article></div>`:''}
  </section>`;
}

function runnerBlock(lesson){
  const code=currentCode(lesson);
  const dom=lesson.runner==='dom';
  const node=lesson.runner==='node-model';
  if(node){
    const probe=nodeProbeFor(lesson.id);
    const imported=state.nodeMetrics[lesson.id];
    return `<section class="runner-card reveal"><div class="runner-head"><div><p class="eyebrow">Run on your real Node process</p><h2>Actual Node resource probe</h2></div><span>official process/perf metrics</span></div>
      <p class="runner-note">GitHub Pages cannot execute Node or read your OS process counters. Save this as <code>resource-probe.mjs</code>, run <code>node resource-probe.mjs</code>, then paste the final JSON object below.</p>
      <textarea class="code-editor node-probe" readonly spellcheck="false">${escapeHtml(probe)}</textarea>
      <label class="node-import"><span>Paste Node probe JSON</span><textarea data-node-metrics-input spellcheck="false" placeholder='{"node":"v26.x", "memory":{...}}'>${imported?escapeHtml(JSON.stringify(imported,null,2)):''}</textarea></label>
      <div class="runner-actions"><button class="primary" data-import-node-metrics>Visualize measured Node resources</button></div>
      <div class="actual-resource-host" data-actual-resource>${renderNodeMetrics(imported)}</div>
    </section>`;
  }
  return `<section class="runner-card reveal"><div class="runner-head"><div><p class="eyebrow">Run the JavaScript</p><h2>${dom?'Browser main-thread sandbox':'Disposable JavaScript Worker'}</h2></div><span>${dom?'DOM + long-task measurements':'wall time + event-loop delay'}</span></div>
    <textarea class="code-editor" data-code-editor spellcheck="false">${escapeHtml(code)}</textarea>
    <div class="runner-actions"><button class="secondary" data-reset-code>Reset</button><button class="primary" data-run-code>${dom?'Run in browser sandbox':'Run JavaScript'}</button></div>
    <div class="run-layout"><pre class="run-output" data-run-output>Ready.</pre><div class="sandbox-host" data-sandbox-host>${dom?'<span>Sandboxed browser output appears here.</span>':'<span>Execution is isolated from the app.</span>'}</div></div>
    <div class="actual-resource-host" data-actual-resource>${renderBrowserMetrics(state.metrics[lesson.id])}</div>
  </section>`;
}
function lessonView(lesson){
  const topic=getTopic(lesson.topic);
  const comfortable=!!state.comfortable[lesson.id];
  const mastery=state.mastery[lesson.id]||[false,false,false,false];
  const next=nextLesson(lesson);
  return chrome(`<main class="page lesson-page">
    <section class="lesson-head reveal"><button class="back" data-nav="index">← Index</button><span class="position">${LESSONS.indexOf(lesson)+1} / ${LESSONS.length}</span><p class="eyebrow">${escapeHtml(topic?.title||'JavaScript')}</p><h1>${escapeHtml(lesson.title)}</h1><p class="lead">${escapeHtml(lesson.summary)}</p><a class="source-pill" href="${lesson.source}" target="_blank" rel="noreferrer"><b>${escapeHtml(sourceName(lesson.source))}</b><span>${escapeHtml(sourceDomain(lesson.source))}</span><em>↗</em></a></section>
    ${lesson.debug?debugBlock(lesson):`<section class="compare-grid reveal delay-2">${compareCard('poor',lesson.compare.bad,lesson.source)}<div class="compare-arrow">→</div>${compareCard('better',lesson.compare.good,lesson.source)}</section>`}
    ${runnerBlock(lesson)}
    ${tips(lesson)}
    <section class="reference-card reveal"><div><p class="eyebrow">Primary source for this lesson</p><h3>${escapeHtml(sourceName(lesson.source))}</h3><p>Both the explanation and examples are adapted for teaching from this official reference.</p></div><a href="${lesson.source}" target="_blank" rel="noreferrer">Open source ↗</a></section>
    <section class="mastery-card reveal"><p class="eyebrow">Leave this lesson able to…</p><div class="mastery-list">${[
      'Explain the concept without reading the code.',
      'Predict what the example will do before running it.',
      'Read the actual measurements and explain which resource changed and why.',
      'Name the bad-practice failure mode and the trade-off in the better approach.'
    ].map((text,i)=>`<label><input type="checkbox" data-mastery="${i}" ${mastery[i]?'checked':''}><span>${escapeHtml(text)}</span></label>`).join('')}</div></section>
    <section class="lesson-actions reveal"><button class="comfort ${comfortable?'on':''}" data-comfort><span>${comfortable?'✓':'○'}</span>${comfortable?'Comfortable':'Mark comfortable'}</button>${next?`<button class="primary" data-lesson="${next.id}" ${comfortable?'':'disabled'}>Next lesson →</button>`:'<button class="primary" data-nav="home">Curriculum complete →</button>'}</section>
  </main>`);
}

function errorView(error){return chrome(`<main class="page"><section class="error-card"><p class="eyebrow">Render error</p><h1>This screen could not be rendered.</h1><p>${escapeHtml(error?.message||error)}</p><button class="primary" data-nav="home">Return home</button></section></main>`)}

function renderApp(){
  closeDrawer();
  const r=route();
  try{
    if(r.view==='lesson'){
      const lesson=getLesson(r.id);
      if(!lesson){navigate('index');return}
      state=normalizeState(reduceState(state,{type:'OPEN_LESSON',id:lesson.id},CTX),LESSONS,TOPICS); saveState();
      root.innerHTML=lessonView(lesson);
    } else if(r.view==='index') root.innerHTML=indexView();
    else root.innerHTML=homeView();
  }catch(error){console.error(error);root.innerHTML=errorView(error)}
}

function openDrawer(){const d=root.querySelector('[data-drawer]'),b=root.querySelector('[data-drawer-backdrop]'); if(!d||!b)return;d.classList.add('open');b.classList.add('open');d.setAttribute('aria-hidden','false');document.body.classList.add('drawer-open')}
function closeDrawer(){document.body.classList.remove('drawer-open');const d=root.querySelector('[data-drawer]'),b=root.querySelector('[data-drawer-backdrop]');if(d){d.classList.remove('open');d.setAttribute('aria-hidden','true')}if(b)b.classList.remove('open')}
function updateIndexRows(){if(route().view!=='index')return;const host=root.querySelector('[data-index-rows]');const count=root.querySelector('[data-result-count]');if(host)host.innerHTML=indexRows(filteredLessons());if(count)count.textContent=`${filteredLessons().length} lessons`}

async function runCurrent(portable=false){
  if(running)return;
  const lesson=currentLesson();
  const output=root.querySelector('[data-run-output]');
  const editor=root.querySelector('[data-code-editor]');
  const sandbox=root.querySelector('[data-sandbox-host]');
  if(!output||!editor)return;
  running=true; output.textContent='Running…';
  try{
    let result;
    if(lesson.runner==='dom'&&!portable) result=await runDomExample(editor.value,sandbox);
    else result=await runWorkerCode(editor.value);
    dispatch({type:'SET_METRICS',id:lesson.id,value:result},{render:false});
    const header=result.ok?'✓ completed':'✕ failed';
    const time=Number.isFinite(result.duration)?`\nwall time: ${result.duration.toFixed(2)} ms`:'';
    const logs=(result.lines||[]).join('\n');
    output.textContent=`${header}${time}${logs?'\n\n'+logs:''}${result.error?'\n\n'+result.error:''}`;
    output.classList.toggle('failed',!result.ok);
    const metricsHost=root.querySelector('[data-actual-resource]');
    if(metricsHost) metricsHost.innerHTML=renderBrowserMetrics(result);
  }finally{running=false}
}

root.addEventListener('click',event=>{
  const target=event.target.closest('button,a');
  if(!target)return;
  if(target.matches('[data-drawer-open]')){openDrawer();return}
  if(target.matches('[data-drawer-close],[data-drawer-backdrop]')){closeDrawer();return}
  if(target.dataset.nav){event.preventDefault();navigate(target.dataset.nav);return}
  if(target.hasAttribute('data-topic')){
    const id=target.dataset.topic||'';
    if(id)dispatch({type:'SELECT_TOPIC',id},{render:false});else{state={...state,topic:''};saveState()}
    closeDrawer();navigate('index');return;
  }
  if(target.dataset.lesson){dispatch({type:'OPEN_LESSON',id:target.dataset.lesson},{render:false});navigate('lesson/'+target.dataset.lesson);return}
  if(target.hasAttribute('data-run-code')){runCurrent(false);return}
  if(target.hasAttribute('data-run-portable')){runCurrent(true);return}
  if(target.hasAttribute('data-reset-code')){const lesson=currentLesson();dispatch({type:'RESET_CODE',id:lesson.id},{render:false});const editor=root.querySelector('[data-code-editor]');if(editor)editor.value=lesson.code;return}
  if(target.dataset.debugAnswer!==undefined){dispatch({type:'SET_DEBUG_ANSWER',id:currentLesson().id,answer:Number(target.dataset.debugAnswer)});return}
  if(target.hasAttribute('data-debug-reveal')){dispatch({type:'REVEAL_DEBUG',id:currentLesson().id});return}
  if(target.hasAttribute('data-import-node-metrics')){const input=root.querySelector('[data-node-metrics-input]');const host=root.querySelector('[data-actual-resource]');try{const parsed=JSON.parse(input?.value||'');dispatch({type:'SET_NODE_METRICS',id:currentLesson().id,value:parsed},{render:false});if(host)host.innerHTML=renderNodeMetrics(parsed)}catch(error){if(host)host.innerHTML=`<div class="actual-empty error"><strong>Invalid JSON.</strong><p>${escapeHtml(error.message)}</p></div>`}return}
  if(target.hasAttribute('data-comfort')){dispatch({type:'TOGGLE_COMFORT',id:currentLesson().id});return}
});

root.addEventListener('input',event=>{
  const input=event.target;
  if(input.matches('[data-code-editor]')){dispatch({type:'SET_CODE',id:currentLesson().id,value:input.value},{render:false});return}
  if(input.matches('[data-search]')){dispatch({type:'SET_SEARCH',value:input.value},{render:false});updateIndexRows();return}
});
root.addEventListener('change',event=>{
  const input=event.target;
  if(input.matches('[data-mastery]'))dispatch({type:'SET_MASTERY',id:currentLesson().id,index:Number(input.dataset.mastery),value:input.checked},{render:false});
});
root.addEventListener('click',event=>{if(event.target.matches('[data-drawer-backdrop]'))closeDrawer()});
window.addEventListener('hashchange',renderApp);
window.addEventListener('keydown',event=>{if(event.key==='Escape')closeDrawer()});

async function removeLegacyWorkers(){
  if(!('serviceWorker'in navigator))return;
  try{const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()))}catch{}
}
removeLegacyWorkers();
if(!location.hash)location.hash='home';else renderApp();