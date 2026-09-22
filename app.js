import { TOPICS, LESSONS, getLesson, getTopic, lessonsFor, sourceName } from './curriculum.js';
import { TOPIC_QUIZZES, getTopicQuiz } from './quizzes.js';
import { CHALLENGES, getChallenge } from './challenges.js';
import { formatJavaScript } from './lesson-utils.js';
import { createDefaultState, normalizeState, reduceState, countCompletedTopics, countVisited } from './state-model.js';
import { runWorkerCode, runDomExample, nodeProbeFor } from './runner.js';
import { renderBrowserMetrics, renderNodeMetrics } from './resource-visuals.js';

const root=document.querySelector('#app');
const STORE='swe-revision-labs:javascript-v3';
const THEME_STORE='swe-revision-labs:theme';
const CTX={lessons:LESSONS,topics:TOPICS,quizzes:TOPIC_QUIZZES,challenges:CHALLENGES};
let state=loadState();
let running=false;
let domRunController=null;
let drawerReturnFocus=null;
let challengeTimer=null;
let challengeCheckRunning=false;
const SANDBOX_STOPPED_HTML='<span>Sandbox stopped. Scheduled work was discarded.</span>';

function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function loadState(){
  try{return normalizeState(JSON.parse(localStorage.getItem(STORE)||'{}'),LESSONS,TOPICS,TOPIC_QUIZZES,CHALLENGES)}
  catch{return createDefaultState(LESSONS,TOPICS)}
}
function saveState(){
  try{localStorage.setItem(STORE,JSON.stringify(state))}catch(error){console.warn('State persistence failed',error)}
}
function dispatch(action,{render=true}={}){
  state=normalizeState(reduceState(state,action,CTX),LESSONS,TOPICS,TOPIC_QUIZZES,CHALLENGES);
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
function scrollToPageTop(){
  const html=document.documentElement;
  const previousBehavior=html.style.scrollBehavior;
  html.style.scrollBehavior='auto';
  window.scrollTo(0,0);
  html.style.scrollBehavior=previousBehavior;
}
function currentLesson(){return getLesson(state.current)||LESSONS[0]}
function currentCode(lesson){return formatJavaScript(state.code[lesson.id]??lesson.code)}
function lineNumbers(code){return code.split('\n').map((_,index)=>`<span>${index+1}</span>`).join('')}
function editorShell(code,{label='lesson.js',readonly=false,ariaLabel='JavaScript editor',challenge=false}={}){
  const formatted=formatJavaScript(code);
  return `<div class="code-workbench ${readonly?'readonly':''}" data-editor-shell>
    <div class="editor-titlebar"><div class="editor-window-controls" aria-hidden="true"><i></i><i></i><i></i></div><div class="editor-tab"><b>JS</b><span>${escapeHtml(label)}</span></div><span class="editor-language">JavaScript</span></div>
    <div class="editor-body"><div class="editor-gutter" data-code-gutter aria-hidden="true">${lineNumbers(formatted)}</div><textarea class="code-editor" aria-label="${escapeHtml(ariaLabel)}" data-code-editor ${challenge?'data-challenge-editor':''} spellcheck="false" autocomplete="off" autocapitalize="off" ${readonly?'readonly':''}>${escapeHtml(formatted)}</textarea></div>
    <div class="editor-statusbar"><span data-editor-line-status>${formatted.split('\n').length} ${formatted.split('\n').length===1?'line':'lines'}</span><span>JavaScript · UTF-8 · Spaces: 2</span></div>
  </div>`;
}
function lessonBrief(lesson){
  const tip=lesson.tips?.[0]||'Make the important behaviour explicit so it is easier to review and maintain.';
  const debug=lesson.debug;
  const label=debug?'What this lab is diagnosing':'Why the right-hand example is better';
  const tag=debug?'diagnose first':'read this first';
  const reason=debug?`<strong>Start here:</strong> Identify the failure mode before revealing the diagnosis. ${escapeHtml(debug.question)}`:`<strong>What improves:</strong> The clearer version makes the key behaviour visible instead of relying on an implicit rule or hiding the result. ${escapeHtml(tip)}`;
  const useWhen=lesson.useWhen?`<section class="lesson-use-when"><p class="lesson-use-when-label">When to use it</p><p>${escapeHtml(lesson.useWhen)}</p></section>`:'';
  return `<div class="lesson-brief"><div class="lesson-brief-head"><span class="lesson-brief-label">${label}</span><span class="lesson-brief-tag">${tag}</span></div><p class="lesson-brief-summary">${escapeHtml(lesson.summary)}</p><p class="lesson-brief-reason">${reason}</p>${useWhen}</div>`;
}
function firstUnvisited(){return LESSONS.find(x=>!state.visited[x.id])||LESSONS[0]}
function resumeLesson(){return getLesson(state.current)||firstUnvisited()}
function percent(a,b){return b?Math.round(a/b*100):0}
function topicProgress(topic){const items=lessonsFor(topic.id);const visited=countVisited(state,items);const quizPassed=!!state.quiz[topic.id]?.passed;return {visited,total:items.length,percent:percent(visited,items.length),quizPassed}}
function nextLesson(lesson){const i=LESSONS.findIndex(x=>x.id===lesson.id);return LESSONS[i+1]||null}
function sourceDomain(url){try{return new URL(url).hostname.replace(/^www\./,'')}catch{return''}}
function currentTheme(){return document.documentElement.dataset.theme==='dark'?'dark':'light'}
function setTheme(theme){
  const next=theme==='dark'?'dark':'light';
  document.documentElement.dataset.theme=next;
  try{localStorage.setItem(THEME_STORE,next)}catch(error){console.warn('Theme preference failed',error)}
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',next==='dark'?'#141517':'#f3f3ef');
}
function themeToggleMarkup(){
  const dark=currentTheme()==='dark';
  return `<span class="theme-toggle-icon" aria-hidden="true">${dark?'☼':'☾'}</span><span><b>${dark?'Light mode':'Dark mode'}</b><small>Make the interface easier on the eyes</small></span><em>${dark?'On':'Off'}</em>`;
}

function icon(){return `<span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>`}
function drawer(){
  const dark=currentTheme()==='dark';
  return `<div class="drawer-backdrop" data-drawer-backdrop></div><aside id="site-drawer" class="drawer" data-drawer role="dialog" aria-modal="true" aria-label="JavaScript index" aria-hidden="true">
    <div class="drawer-head"><div><p class="eyebrow">SWE Revision Labs</p><h2>JavaScript index</h2></div><button data-drawer-close class="icon-button" aria-label="Close menu">×</button></div>
    <nav class="drawer-nav">
      <button data-nav="home"><span>01</span><b>Learn</b><small>Continue your current concept</small><em>→</em></button>
      <button data-nav="index"><span>02</span><b>Full index</b><small>${LESSONS.length} lessons · searchable</small><em>→</em></button>
      <button data-nav="practice"><span>03</span><b>Timed practice</b><small>Write, run, and verify code</small><em>→</em></button>
    </nav>
    <button class="theme-toggle" data-theme-toggle aria-pressed="${dark}" aria-label="Switch to ${dark?'light':'dark'} mode">${themeToggleMarkup()}</button>
    <div class="drawer-topics"><p class="eyebrow">Topics</p>${TOPICS.map(topic=>`<button data-topic="${topic.id}">${escapeHtml(topic.title)}<span>${lessonsFor(topic.id).length}</span></button>`).join('')}</div>
  </aside>`;
}
function chrome(content){
  return `<div class="site"><header class="topbar"><button class="brand" data-nav="home">${icon()}<span>SWE Revision Labs</span></button><button class="menu-button" data-drawer-open aria-controls="site-drawer" aria-expanded="false" aria-label="Open menu"><span></span><span></span><span></span></button></header>${content}${drawer()}</div>`;
}

function homeView(){
  const completed=countCompletedTopics(state,TOPICS);
  const resume=resumeLesson();
  const topicCards=TOPICS.map(topic=>{const p=topicProgress(topic);return `<button class="topic-card" data-topic="${topic.id}"><span class="topic-count">${String(TOPICS.indexOf(topic)+1).padStart(2,'0')}</span><span class="topic-copy"><strong>${escapeHtml(topic.title)}</strong><small>${escapeHtml(topic.description)} · ${p.visited}/${p.total} lessons · ${p.quizPassed?'quiz passed':'quiz at the end'}</small></span><span class="topic-progress">${p.quizPassed?'✓':`${p.visited}/${p.total}`}</span></button>`}).join('');
  return chrome(`<main class="page home-page">
    <section class="hero reveal"><div class="hero-copy"><p class="eyebrow">JavaScript · browser + Node.js</p><h1>Understand the language.<br>Then understand the machine.</h1></div><div class="hero-meta"><p class="lead">From primitives and closures to the browser render pipeline, Node's event loop, heap pressure, buffers, streams and OS resources. Every lesson is sourced only from MDN or the official Node.js docs.</p>
      <div class="progress-block"><div><span>Topics completed</span><strong>${completed}/${TOPICS.length}</strong></div><div class="progress-line" role="progressbar" aria-label="Topics completed" aria-valuemin="0" aria-valuemax="${TOPICS.length}" aria-valuenow="${completed}"><i style="width:${percent(completed,TOPICS.length)}%"></i></div></div></div>
    </section>
    <section class="continue-card reveal delay-1"><div><span class="tag">Continue</span><h2>${escapeHtml(resume.title)}</h2><p>${escapeHtml(getTopic(resume.topic)?.title||'')} · ${sourceName(resume.source)}</p></div><div class="continue-flow"><span>concept</span><b>→</b><span>code</span><b>→</b><span>run</span><b>→</b><span>machine</span></div><button class="primary" data-lesson="${resume.id}">Open lesson</button></section>
    <section class="practice-promo reveal delay-2"><div><p class="eyebrow">Timed practice</p><h2>Can you write it under pressure?</h2><p>Short, unique JavaScript tasks with a real timer and output verification. Your editor stays familiar; the answer has to run.</p></div><div class="practice-promo-meta"><span>${CHALLENGES.length} challenges</span><span>${Math.min(...CHALLENGES.map(challenge=>challenge.seconds))}–${Math.max(...CHALLENGES.map(challenge=>challenge.seconds))} seconds</span><button class="secondary" data-nav="practice">Start practising →</button></div></section>
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
  return items.map((lesson,index)=>`<button class="lesson-row" data-lesson="${lesson.id}" data-search-text="${escapeHtml((lesson.title+' '+lesson.summary).toLowerCase())}"><span class="row-index">${String(index+1).padStart(2,'0')}</span><span><strong>${escapeHtml(lesson.title)}</strong><small>${escapeHtml(sourceName(lesson.source))} · ${escapeHtml(sourceDomain(lesson.source))}</small></span></button>`).join('');
}
function indexResults(items){
  if(!items.length)return '<div class="empty-state"><strong>No lessons match that search.</strong><p>Try a broader concept or clear the search to browse the full index.</p><button class="secondary" data-clear-search>Clear search</button></div>';
  const visibleTopics=TOPICS.filter(topic=>items.some(lesson=>lesson.topic===topic.id));
  return visibleTopics.map(topic=>{
    const topicItems=items.filter(lesson=>lesson.topic===topic.id);
    const progress=topicProgress(topic);
    return `<section class="topic-group"><div class="topic-group-head"><div><p class="eyebrow">Topic ${String(TOPICS.indexOf(topic)+1).padStart(2,'0')}</p><strong>${escapeHtml(topic.title)}</strong></div><span>${progress.visited}/${progress.total} visited · ${progress.quizPassed?'quiz passed':'quiz at the end'}</span></div><div class="topic-group-list">${indexRows(topicItems)}</div><button class="topic-quiz-link" data-quiz="${topic.id}">${progress.quizPassed?'Retake topic quiz':'Take topic quiz'} →</button></section>`;
  }).join('');
}
function indexView(){
  const items=filteredLessons();
  const rows=indexResults(items);
  return chrome(`<main class="page index-page"><section class="index-head reveal"><p class="eyebrow">Complete JavaScript index</p><h1>${LESSONS.length} lessons</h1><p class="lead">Search by concept or work topic-by-topic. Every example carries its exact MDN or Node.js source.</p><label class="search"><span aria-hidden="true">⌕</span><input aria-label="Search lessons" data-search value="${escapeHtml(state.search)}" placeholder="closures, heap, fetch, streams…" autocomplete="off"></label></section>
    <div class="topic-scroller reveal delay-1"><button class="chip ${state.topic===''?'active':''}" data-topic="">All</button>${TOPICS.map(topic=>`<button class="chip ${state.topic===topic.id?'active':''}" data-topic="${topic.id}">${escapeHtml(topic.title)}</button>`).join('')}</div>
    <section class="index-list reveal delay-2"><div class="list-head"><strong>${state.topic?escapeHtml(getTopic(state.topic)?.title||'Topic'):'Lessons grouped by topic'}</strong><span data-result-count>${items.length} lessons</span></div><div data-index-rows>${rows}</div></section>
  </main>`);
}

function compareCard(kind,code,source){return `<article class="compare-card ${kind}"><header><span>${kind==='poor'?'Poor / risky':'Better / clearer'}</span><a href="${source}" target="_blank" rel="noreferrer">reference ↗</a></header><pre><code>${escapeHtml(formatJavaScript(code))}</code></pre></article>`}
function expressionTracePanel(kind,steps){
  return `<article class="trace-panel ${kind}"><header><div><p class="eyebrow">${kind==='poor'?'Risky trace':'Clearer trace'}</p><strong>${kind==='poor'?'Value is evaluated, then lost':'Value is updated, then emitted'}</strong></div><span>${kind==='poor'?'no output':'output: 1'}</span></header><ol>${steps.map((step,index)=>`<li data-trace-side="${kind}" data-trace-step="${index}"><code>${escapeHtml(step.code)}</code><span>${escapeHtml(step.label)}</span><b>${escapeHtml(step.value)}</b></li>`).join('')}</ol><div class="trace-result"><span>Program output</span><strong data-trace-output="${kind}">—</strong></div></article>`;
}
function expressionVisual(){
  const poor=[
    {code:'let total = 0;',label:'statement · creates a binding',value:'total → 0'},
    {code:'total = total + 1;',label:'statement · reads, computes, writes',value:'0 + 1 → 1'},
    {code:'total',label:'expression · produces a value',value:'1 · discarded'}
  ];
  const better=[
    {code:'let total = 0;',label:'statement · creates a binding',value:'total → 0'},
    {code:'total += 1;',label:'statement · concise update',value:'0 + 1 → 1'},
    {code:'console.log(total);',label:'statement · explicitly emits output',value:'console → 1'}
  ];
  return `<section class="why-card reveal" data-expression-trace data-trace-step="0"><div class="why-head"><div><p class="eyebrow">See the difference</p><h2>Same result, clearer intent</h2><p>The arithmetic is equivalent here. The clearer version makes the update and the output visible to the reader and to the program.</p></div><div class="trace-controls"><button class="secondary" data-expression-trace-action="previous" aria-label="Show previous explanation step">←</button><span data-trace-counter>Step 1 of 3</span><button class="secondary" data-expression-trace-action="next" aria-label="Show next explanation step">→</button></div></div><div class="trace-grid">${expressionTracePanel('poor',poor)}${expressionTracePanel('better',better)}</div><p class="trace-note" data-trace-note>Both versions start by binding <code>total</code> to <code>0</code>. Move through the steps to see where their communication differs.</p></section>`;
}
function renderExpressionTrace(host,step){
  const max=3;
  const current=Math.max(0,Math.min(max-1,step));
  host.dataset.traceStep=String(current);
  host.querySelectorAll('[data-trace-step]').forEach(item=>{
    const index=Number(item.dataset.traceStep);
    item.classList.toggle('active',index===current);
    item.classList.toggle('complete',index<current);
  });
  const notes=[
    'Both versions start by binding total to 0. Move through the steps to see where their communication differs.',
    'Both versions compute 0 + 1 and store 1. += communicates “update this binding” without repeating the name.',
    'The bare total expression evaluates to 1, but a script does not display that value. console.log explicitly sends 1 to the output.'
  ];
  const outputs=[['—','—'],['—','—'],['—','1']];
  host.querySelector('[data-trace-counter]').textContent=`Step ${current+1} of ${max}`;
  host.querySelector('[data-trace-note]').innerHTML=notes[current];
  host.querySelector('[data-trace-output="poor"]').textContent=outputs[current][0];
  host.querySelector('[data-trace-output="better"]').textContent=outputs[current][1];
  host.querySelector('[data-expression-trace-action="previous"]').disabled=current===0;
  host.querySelector('[data-expression-trace-action="next"]').disabled=current===max-1;
}
function syncCodeEditor(){
  const editor=root.querySelector('[data-code-editor]');
  const gutter=root.querySelector('[data-code-gutter]');
  if(!editor||!gutter)return;
  const lines=editor.value.split('\n').length;
  gutter.innerHTML=lineNumbers(editor.value);
  gutter.scrollTop=editor.scrollTop;
  const status=root.querySelector('[data-editor-line-status]');
  if(status)status.textContent=`${lines} ${lines===1?'line':'lines'}`;
}
function updateEditorValue(editor,value,start=editor.selectionStart,end=start){
  editor.value=value;
  editor.selectionStart=Math.max(0,Math.min(value.length,start));
  editor.selectionEnd=Math.max(0,Math.min(value.length,end));
  editor.dispatchEvent(new Event('input',{bubbles:true}));
  syncCodeEditor();
}
function indentEditor(editor,unindent=false){
  const value=editor.value;
  const start=editor.selectionStart;
  const end=editor.selectionEnd;
  const lineStart=value.lastIndexOf('\n',Math.max(0,start-1))+1;
  const endMarker=value.indexOf('\n',end);
  const lineEnd=endMarker===-1?value.length:endMarker;
  const selected=value.slice(lineStart,lineEnd);
  if(start===end&&!unindent){updateEditorValue(editor,value.slice(0,start)+'  '+value.slice(end),start+2,end+2);return}
  const lines=selected.split('\n');
  let changed=0;
  const next=lines.map(line=>{
    if(unindent){const match=line.match(/^ {1,2}/);if(match){changed+=match[0].length;return line.slice(match[0].length)}}
    else {changed+=2;return `  ${line}`}
    return line;
  }).join('\n');
  const nextValue=value.slice(0,lineStart)+next+value.slice(lineEnd);
  const delta=unindent?-changed:changed;
  updateEditorValue(editor,nextValue,lineStart,end+delta);
}
function formatEditor(editor){
  updateEditorValue(editor,formatJavaScript(editor.value),editor.selectionStart,editor.selectionEnd);
}
function toggleEditorComment(editor){
  const value=editor.value;
  const start=editor.selectionStart;
  const end=editor.selectionEnd;
  const lineStart=value.lastIndexOf('\n',Math.max(0,start-1))+1;
  const endMarker=value.indexOf('\n',end);
  const lineEnd=endMarker===-1?value.length:endMarker;
  const selected=value.slice(lineStart,lineEnd);
  const lines=selected.split('\n');
  const uncomment=lines.every(line=>!line.trim()||/^\s*\/\//.test(line));
  let offset=0;
  const next=lines.map(line=>{
    if(uncomment){const match=line.match(/^(\s*)\/\/ ?/);if(!match)return line;offset-=match[0].length;return match[1]+line.slice(match[0].length)}
    offset+=3;return line?`// ${line}`:'// ';
  }).join('\n');
  updateEditorValue(editor,value.slice(0,lineStart)+next+value.slice(lineEnd),Math.max(lineStart,start+offset),Math.max(lineStart,end+offset));
}
function moveEditorLine(editor,direction){
  const value=editor.value;
  const start=editor.selectionStart;
  const end=editor.selectionEnd;
  const first=value.lastIndexOf('\n',Math.max(0,start-1))+1;
  const lines=value.split('\n');
  const lineIndex=value.slice(0,first).split('\n').length-1;
  const targetIndex=lineIndex+direction;
  if(targetIndex<0||targetIndex>=lines.length)return;
  const columnStart=start-first;
  const columnEnd=end-first;
  [lines[lineIndex],lines[targetIndex]]=[lines[targetIndex],lines[lineIndex]];
  const nextValue=lines.join('\n');
  const nextFirst=lines.slice(0,targetIndex).reduce((sum,line)=>sum+line.length+1,0);
  updateEditorValue(editor,nextValue,nextFirst+columnStart,nextFirst+columnEnd);
}
function handleEditorShortcut(event){
  const editor=event.target.closest?.('[data-code-editor]');
  if(!editor)return false;
  if(editor.readOnly)return false;
  if(event.key==='Escape'){
    editor.dataset.tabOut='true';
    return false;
  }
  if(event.key==='Tab'&&editor.dataset.tabOut==='true'){
    delete editor.dataset.tabOut;
    return false;
  }
  delete editor.dataset.tabOut;
  const modifier=event.ctrlKey||event.metaKey;
  if(modifier&&event.key.toLowerCase()==='s'){
    event.preventDefault();
    return true;
  }
  if(modifier&&event.key==='Enter'){
    event.preventDefault();
    if(editor.matches('[data-challenge-editor]')){
      const challenge=challengeForState();
      if(!state.challenge.startedAt&&!state.challenge.results[challenge.id])startChallenge();
      else submitChallenge(false);
    }else runCurrent(false);
    return true;
  }
  if(event.shiftKey&&event.altKey&&event.key.toLowerCase()==='f'){
    event.preventDefault();formatEditor(editor);return true;
  }
  if(modifier&&event.key==='/'){
    event.preventDefault();toggleEditorComment(editor);return true;
  }
  if(event.key==='Tab'){
    event.preventDefault();indentEditor(editor,event.shiftKey);return true;
  }
  if(event.altKey&&event.key==='ArrowUp'){
    event.preventDefault();moveEditorLine(editor,-1);return true;
  }
  if(event.altKey&&event.key==='ArrowDown'){
    event.preventDefault();moveEditorLine(editor,1);return true;
  }
  return false;
}
function quizView(topicId){
  const topic=getTopic(topicId);
  const quiz=getTopicQuiz(topicId);
  if(!topic||!quiz)return '';
  const progress=state.quiz[topicId]||{answers:Array(quiz.questions.length).fill(null),submitted:false,passed:false};
  const answered=progress.answers.filter(answer=>answer!==null&&answer!==undefined).length;
  const score=quiz.questions.reduce((sum,question,index)=>sum+(progress.answers[index]===question.answer?1:0),0);
  const last=lessonsFor(topicId).at(-1);
  const questionMarkup=quiz.questions.map((question,index)=>{
    const selected=progress.answers[index];
    return `<fieldset class="quiz-question"><legend><span>${String(index+1).padStart(2,'0')}</span>${escapeHtml(question.prompt)}</legend><div class="quiz-options">${question.options.map((option,optionIndex)=>{const correct=progress.submitted&&optionIndex===question.answer;const wrong=progress.submitted&&selected===optionIndex&&!correct;return `<button type="button" class="quiz-option ${selected===optionIndex?'selected':''} ${correct?'correct':''} ${wrong?'wrong':''}" aria-pressed="${selected===optionIndex}" ${progress.submitted?'disabled':''} data-quiz-answer data-quiz-topic="${topicId}" data-quiz-question="${index}" data-quiz-value="${optionIndex}"><span>${String.fromCharCode(65+optionIndex)}</span>${escapeHtml(option)}</button>`}).join('')}</div>${progress.submitted?`<p class="quiz-explanation ${selected===question.answer?'right':'wrong'}">${selected===question.answer?'Correct.':'Review this:'} ${escapeHtml(question.explanation)}</p>`:''}</fieldset>`;
  }).join('');
  const quizAction=progress.submitted?`<button class="secondary" type="button" data-retake-quiz data-quiz-topic="${topicId}">${progress.passed?'Retake quiz':'Try again'}</button>`:`<button class="primary" type="button" data-submit-quiz data-quiz-topic="${topicId}" ${answered<quiz.questions.length?'disabled':''}>Submit quiz</button>`;
  return chrome(`<main class="page quiz-page"><section class="quiz-head reveal"><button class="back" data-topic="${topicId}">← ${escapeHtml(topic.title)}</button><p class="eyebrow">End-of-topic assessment</p><h1>${escapeHtml(quiz.title)}</h1><p class="lead">Answer the questions without looking back. You need all ${quiz.questions.length} answers selected before you can submit, and every answer must be correct to pass.</p><div class="quiz-progress"><span>${answered}/${quiz.questions.length} answered</span><span>${progress.submitted?`${score}/${quiz.questions.length}`:'not submitted'}</span></div></section><section class="quiz-card reveal delay-1"><form>${questionMarkup}<div class="quiz-actions">${quizAction}${progress.submitted?`<span class="quiz-result ${progress.passed?'passed':'failed'}">${progress.passed?'✓ Topic passed':'Keep practising'} · ${score}/${quiz.questions.length}</span>`:''}</div></form></section><section class="quiz-footer reveal delay-2"><p>${progress.passed?'You have demonstrated the core ideas in this topic.':'You can retry this quiz at any time; changing an answer resets the current attempt.'}</p><div class="lesson-actions"><button class="secondary" data-topic="${topicId}">Review topic lessons</button>${progress.passed&&last?`<button class="primary" data-lesson="${nextLesson(last)?.id||last.id}">${nextLesson(last)?'Continue to next topic':'Back to the final lesson'} →</button>`:''}</div></section></main>`);
}
function challengeOutput(lines=[]){return lines.map(line=>String(line).trimEnd()).join('\n').trim()}
function challengeTimerText(seconds){const value=Math.max(0,Math.ceil(seconds));return `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`}
function challengeForState(){return getChallenge(state.challenge.currentId)||CHALLENGES.find(challenge=>!state.challenge.completed.includes(challenge.id))||CHALLENGES[0]}
function challengeView(){
  const completed=state.challenge.completed.length;
  if(completed>=CHALLENGES.length)return chrome(`<main class="page practice-page"><section class="practice-complete reveal"><p class="eyebrow">Practice complete</p><h1>${CHALLENGES.length} tasks. One stronger muscle.</h1><p class="lead">You have worked through every timed challenge. Run them again whenever you want to sharpen a specific JavaScript pattern.</p><div class="practice-complete-stat"><strong>${CHALLENGES.length}/${CHALLENGES.length}</strong><span>challenges completed</span></div><div class="lesson-actions"><button class="secondary" data-reset-challenges>Start over</button><button class="primary" data-nav="home">Back to learning →</button></div></section></main>`);
  const challenge=challengeForState();
  const result=state.challenge.results[challenge.id];
  const active=!!state.challenge.startedAt&&!result;
  const code=state.challenge.code[challenge.id]??challenge.starter;
  const completedLabel=`${completed}/${CHALLENGES.length} completed`;
  const resultOutput=result?challengeOutput(result.output?[result.output]:[]):'';
  const resultPanel=result?`<div class="challenge-result ${result.passed?'passed':'failed'}" data-challenge-result><div class="challenge-result-head"><strong>${result.passed?'✓ Output verified':'✕ Output did not match'}</strong><span>${result.clockExpired?'time expired':result.timedOut?'execution timed out':`${result.duration}s used`}</span></div><p>${result.passed?'The code ran successfully and produced the expected output.':'The code ran, but the verifier found a mismatch. Compare the actual and expected output, then retry or continue.'}</p><div class="challenge-output-grid"><div><span>Actual output</span><pre>${escapeHtml(resultOutput||'No output')}</pre></div><div><span>Expected output</span><pre>${escapeHtml(challenge.expected.join('\n'))}</pre></div></div></div>`:'';
  const action=result?`<button class="secondary" data-reset-challenge>Retry task</button>${completed<CHALLENGES.length?'<button class="primary" data-next-challenge>Next challenge →</button>':'<button class="primary" data-nav="home">Back to learning →</button>'}`:active?'<button class="secondary" data-reset-challenge>Reset task</button><button class="primary" data-check-challenge>Check output</button>':'<button class="primary" data-start-challenge>Start timer →</button>';
  return chrome(`<main class="page practice-page"><section class="practice-head reveal"><button class="back" data-nav="home">← Learn</button><div class="practice-head-row"><div><p class="eyebrow">Timed practice</p><h1>Write it. Run it. Prove it.</h1><p class="lead">One short JavaScript task at a time. Every challenge has its own time budget, a unique prompt, and a strict output check.</p></div><div class="practice-progress"><strong>${completedLabel}</strong><span>${state.challenge.attempts[challenge.id]||0} attempt${state.challenge.attempts[challenge.id]===1?'':'s'} on this task</span></div></div></section><section class="challenge-card reveal delay-1"><div class="challenge-top"><div><span class="challenge-kicker">${escapeHtml(challenge.difficulty)}</span><p class="eyebrow">${escapeHtml(challenge.topic)}</p><h2 data-challenge-title>${escapeHtml(challenge.title)}</h2></div><div class="challenge-clock"><span>Time limit</span><strong data-challenge-timer>${challengeTimerText(active?(challenge.seconds-(Date.now()-state.challenge.startedAt)/1000):challenge.seconds)}</strong></div></div><p class="challenge-prompt">${escapeHtml(challenge.prompt)}</p><div class="challenge-meta"><span>Task ${String(CHALLENGES.indexOf(challenge)+1).padStart(2,'0')} of ${String(CHALLENGES.length).padStart(2,'0')}</span><span>Output is verified after execution</span></div>${editorShell(code,{label:`${challenge.id}.js`,ariaLabel:'Timed challenge JavaScript editor',challenge,readonly:!!result})}<div class="challenge-shortcuts"><span>VS Code shortcuts</span><kbd>Tab</kbd> indent <kbd>⌘/Ctrl</kbd><kbd>Enter</kbd> run <kbd>Shift</kbd><kbd>Alt</kbd><kbd>F</kbd> format</div><p class="challenge-hint">Hint: ${escapeHtml(challenge.hint)}</p><div class="runner-actions challenge-actions">${action}</div>${resultPanel}</section></main>`);
}
function stopChallengeTimer(){if(challengeTimer){clearInterval(challengeTimer);challengeTimer=null}}
function updateChallengeTimer(){
  const challenge=challengeForState();
  const element=root.querySelector('[data-challenge-timer]');
  if(!challenge||!state.challenge.startedAt||state.challenge.results[challenge.id]){stopChallengeTimer();return}
  const remaining=challenge.seconds-(Date.now()-state.challenge.startedAt)/1000;
  if(element){element.textContent=challengeTimerText(remaining);element.classList.toggle('urgent',remaining<=10)}
  if(remaining<=0){stopChallengeTimer();submitChallenge(true)}
}
function syncChallengeTimer(){
  stopChallengeTimer();
  if(route().view!=='practice')return;
  const challenge=challengeForState();
  if(!state.challenge.startedAt||state.challenge.results[challenge.id])return;
  const remaining=challenge.seconds-(Date.now()-state.challenge.startedAt)/1000;
  if(remaining<=0){submitChallenge(true);return}
  updateChallengeTimer();
  challengeTimer=setInterval(updateChallengeTimer,250);
}
function startChallenge(){
  const challenge=challengeForState();
  if(!challenge||state.challenge.results[challenge.id])return;
  dispatch({type:'START_CHALLENGE',id:challenge.id,startedAt:Date.now()},{render:false});
  renderApp();
}
async function submitChallenge(timedOut=false){
  if(challengeCheckRunning)return;
  const challenge=challengeForState();
  const editor=root.querySelector('[data-challenge-editor]');
  if(!challenge||!editor||state.challenge.results[challenge.id])return;
  challengeCheckRunning=true;
  stopChallengeTimer();
  const startedAt=state.challenge.startedAt||Date.now();
  const elapsed=(Date.now()-startedAt)/1000;
  const check=root.querySelector('[data-check-challenge]');
  if(check){check.disabled=true;check.textContent='Checking output…'}
  if(timedOut){
    dispatch({type:'RECORD_CHALLENGE_RESULT',id:challenge.id,result:{passed:false,timedOut:true,clockExpired:true,duration:challenge.seconds,output:'Time expired before verification.'}},{render:false});
    challengeCheckRunning=false;
    renderApp();
    return;
  }
  const result=await runWorkerCode(editor.value,{timeout:2200});
  const actual=challengeOutput(result.lines||[]);
  const output=actual||String(result.error||'No output');
  const passed=!timedOut&&result.ok&&actual===challenge.expected.join('\n');
  dispatch({type:'RECORD_CHALLENGE_RESULT',id:challenge.id,result:{passed,timedOut:timedOut||!!result.timeout,clockExpired:false,duration:Math.min(challenge.seconds,Math.max(0,Math.round(elapsed))),output}},{render:false});
  challengeCheckRunning=false;
  renderApp();
}
function tips(lesson){return `<div class="insight-grid"><article><p class="eyebrow">Traps</p><ul>${lesson.traps.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></article><article><p class="eyebrow">Useful tips</p><ul>${lesson.tips.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></article></div>`}
function debugBlock(lesson){
  if(!lesson.debug) return '';
  const progress=state.debug[lesson.id]||{answer:null,revealed:false};
  const selected=progress.answer;
  const revealed=progress.revealed;
  return `<section class="debug-card reveal delay-2"><div class="debug-head"><div><p class="eyebrow">Advanced debugging lab</p><h2>${escapeHtml(lesson.debug.symptom)}</h2></div><span>${revealed?'analysis revealed':'diagnose first'}</span></div>
    <pre class="debug-code"><code>${escapeHtml(formatJavaScript(lesson.compare.bad))}</code></pre>
    <div class="debug-question"><p>${escapeHtml(lesson.debug.question)}</p><div class="debug-options">${lesson.debug.options.map((option,index)=>`<button data-debug-answer="${index}" class="${selected===index?'selected':''} ${revealed?(index===lesson.debug.answer?'correct':selected===index?'wrong':''):''}"><span>${String.fromCharCode(65+index)}</span>${escapeHtml(option)}</button>`).join('')}</div></div>
    <div class="debug-actions"><button class="secondary" data-debug-reveal ${selected===null?'disabled':''}>${revealed?'Analysis revealed':'Reveal diagnosis'}</button></div>
    ${revealed?`<div class="debug-analysis"><article><p class="eyebrow">Next thing to inspect</p><p>${escapeHtml(lesson.debug.next)}</p></article><article><p class="eyebrow">Root cause</p><p>${escapeHtml(lesson.debug.root)}</p></article><article><p class="eyebrow">Fix</p><pre><code>${escapeHtml(formatJavaScript(lesson.debug.fix))}</code></pre></article></div>`:''}
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
      ${editorShell(probe,{label:'resource-probe.mjs',readonly:true,ariaLabel:'Generated Node.js resource probe'})}
      <label class="node-import"><span>Paste Node probe JSON</span><textarea aria-label="Node probe JSON" data-node-metrics-input spellcheck="false" placeholder='{"node":"v26.x", "memory":{...}}'>${imported?escapeHtml(JSON.stringify(imported,null,2)):''}</textarea></label>
      <div class="runner-actions"><button class="primary" data-import-node-metrics>Visualize measured Node resources</button></div>
      <div class="actual-resource-host" data-actual-resource>${renderNodeMetrics(imported)}</div>
    </section>`;
  }
  return `<section class="runner-card reveal"><div class="runner-head"><div><p class="eyebrow">Run the JavaScript</p><h2>${dom?'Browser main-thread sandbox':'Disposable JavaScript Worker'}</h2></div><span>${dom?'DOM + long-task measurements':'wall time + event-loop delay'}</span></div>
    ${editorShell(code,{label:`${lesson.id}.js`,ariaLabel:'JavaScript editor'})}
    <div class="runner-actions"><button class="secondary" data-reset-code>Reset</button>${dom?'<button class="secondary" data-stop-sandbox>Stop sandbox</button>':''}<button class="primary" data-run-code>${dom?'Run in browser sandbox':'Run JavaScript'}</button></div>
    <div class="run-layout"><pre class="run-output" data-run-output role="status" aria-live="polite" aria-atomic="true">Ready.</pre><div class="sandbox-host" data-sandbox-host aria-label="Sandbox output">${dom?'<span>Sandboxed browser output appears here.</span>':'<span>Execution is isolated from the app.</span>'}</div></div>
    <div class="actual-resource-host" data-actual-resource>${renderBrowserMetrics(state.metrics[lesson.id])}</div>
  </section>`;
}
function lessonView(lesson){
  const topic=getTopic(lesson.topic);
  const next=nextLesson(lesson);
  const topicLessons=lessonsFor(lesson.topic);
  const topicEnd=topicLessons.at(-1)?.id===lesson.id;
  return chrome(`<main class="page lesson-page">
    <section class="lesson-head reveal"><button class="back" data-nav="index">← Index</button><span class="position">${LESSONS.indexOf(lesson)+1} / ${LESSONS.length}</span><p class="eyebrow">${escapeHtml(topic?.title||'JavaScript')}</p><h1>${escapeHtml(lesson.title)}</h1>${lessonBrief(lesson)}<a class="source-pill" href="${lesson.source}" target="_blank" rel="noreferrer"><b>${escapeHtml(sourceName(lesson.source))}</b><span>${escapeHtml(sourceDomain(lesson.source))}</span><em>↗</em></a></section>
    ${lesson.debug?debugBlock(lesson):`<section class="compare-grid reveal delay-2">${compareCard('poor',lesson.compare.bad,lesson.source)}<div class="compare-arrow">→</div>${compareCard('better',lesson.compare.good,lesson.source)}</section>`}
    ${lesson.id==='syntax-expressions'?expressionVisual():''}
    ${runnerBlock(lesson)}
    ${tips(lesson)}
    <section class="reference-card reveal"><div><p class="eyebrow">Primary source for this lesson</p><h3>${escapeHtml(sourceName(lesson.source))}</h3><p>Both the explanation and examples are adapted for teaching from this official reference.</p></div><a href="${lesson.source}" target="_blank" rel="noreferrer">Open source ↗</a></section>
    <section class="lesson-actions reveal"><button class="secondary" data-nav="index">Back to topic</button>${topicEnd?`<button class="primary" data-quiz="${lesson.topic}">Take topic quiz →</button>`:next?`<button class="primary" data-lesson="${next.id}">Next lesson →</button>`:'<button class="primary" data-nav="home">Curriculum complete →</button>'}</section>
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
      state=normalizeState(reduceState(state,{type:'OPEN_LESSON',id:lesson.id},CTX),LESSONS,TOPICS,TOPIC_QUIZZES,CHALLENGES); saveState();
      root.innerHTML=lessonView(lesson);
      const trace=root.querySelector('[data-expression-trace]');
      if(trace)renderExpressionTrace(trace,0);
      syncCodeEditor();
    } else if(r.view==='index') root.innerHTML=indexView();
    else if(r.view==='practice'){
      root.innerHTML=challengeView();
      syncCodeEditor();
    }
    else if(r.view==='quiz'){
      if(!getTopic(r.id)||!getTopicQuiz(r.id)){navigate('index');return}
      root.innerHTML=quizView(r.id);
    }
    else root.innerHTML=homeView();
  }catch(error){console.error(error);root.innerHTML=errorView(error)}
  syncChallengeTimer();
}

function openDrawer(){
  const d=root.querySelector('[data-drawer]'),b=root.querySelector('[data-drawer-backdrop]'),menu=root.querySelector('[data-drawer-open]');
  if(!d||!b)return;
  drawerReturnFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  d.classList.add('open');b.classList.add('open');d.setAttribute('aria-hidden','false');menu?.setAttribute('aria-expanded','true');document.body.classList.add('drawer-open');
  requestAnimationFrame(()=>d.querySelector('[data-drawer-close]')?.focus());
}
function closeDrawer(){
  document.body.classList.remove('drawer-open');
  const d=root.querySelector('[data-drawer]'),b=root.querySelector('[data-drawer-backdrop]'),menu=root.querySelector('[data-drawer-open]');
  if(d){d.classList.remove('open');d.setAttribute('aria-hidden','true')}
  if(b)b.classList.remove('open');
  menu?.setAttribute('aria-expanded','false');
  if(drawerReturnFocus&&document.contains(drawerReturnFocus))drawerReturnFocus.focus();
  drawerReturnFocus=null;
}
function updateIndexRows(){if(route().view!=='index')return;const items=filteredLessons();const host=root.querySelector('[data-index-rows]');const count=root.querySelector('[data-result-count]');if(host)host.innerHTML=indexResults(items);if(count)count.textContent=`${items.length} lessons`}

function stopSandbox(){
  if(domRunController){domRunController.abort();return}
  const sandbox=root.querySelector('[data-sandbox-host]');
  if(!sandbox||!sandbox.querySelector('iframe'))return;
  // Stopping after a completed run is a sandbox-lifecycle action: the run's
  // result and measurements still stand, only the live sandbox is torn down.
  sandbox.innerHTML='<span>Sandbox stopped; any work it still had scheduled was discarded. The completed run’s output and measurements still stand.</span>';
}

async function runCurrent(portable=false){
  if(running)return;
  const lesson=currentLesson();
  const output=root.querySelector('[data-run-output]');
  const editor=root.querySelector('[data-code-editor]');
  const sandbox=root.querySelector('[data-sandbox-host]');
  if(!output||!editor)return;
  const runButton=root.querySelector('[data-run-code]');
  running=true; output.textContent='Running…'; output.classList.remove('failed');
  if(runButton){runButton.disabled=true;runButton.setAttribute('aria-busy','true')}
  try{
    let result;
    if(lesson.runner==='dom'&&!portable){
      domRunController=new AbortController();
      result=await runDomExample(editor.value,sandbox,{signal:domRunController.signal});
    }
    else result=await runWorkerCode(editor.value);
    if(result.stopped){
      output.textContent='◼ stopped\nThe sandbox and all scheduled work were discarded.';
      output.classList.remove('failed');
      if(sandbox) sandbox.innerHTML=SANDBOX_STOPPED_HTML;
      return;
    }
    dispatch({type:'SET_METRICS',id:lesson.id,value:result},{render:false});
    const header=result.ok?'✓ completed':'✕ failed';
    const time=Number.isFinite(result.duration)?`\nwall time: ${result.duration.toFixed(2)} ms`:'';
    const logs=(result.lines||[]).join('\n');
    output.textContent=`${header}${time}${logs?'\n\n'+logs:''}${result.error?'\n\n'+result.error:''}`;
    output.classList.toggle('failed',!result.ok);
    const metricsHost=root.querySelector('[data-actual-resource]');
    if(metricsHost) metricsHost.innerHTML=renderBrowserMetrics(result);
  }finally{
    running=false;
    domRunController=null;
    if(runButton){runButton.disabled=false;runButton.removeAttribute('aria-busy')}
  }
}

root.addEventListener('click',event=>{
  const target=event.target.closest('button,a');
  if(!target)return;
  if(target.matches('[data-drawer-open]')){openDrawer();return}
  if(target.matches('[data-drawer-close],[data-drawer-backdrop]')){closeDrawer();return}
  if(target.matches('[data-theme-toggle]')){
    setTheme(currentTheme()==='dark'?'light':'dark');
    const dark=currentTheme()==='dark';
    target.setAttribute('aria-pressed',String(dark));
    target.setAttribute('aria-label',`Switch to ${dark?'light':'dark'} mode`);
    target.innerHTML=themeToggleMarkup();
    return;
  }
  if(target.hasAttribute('data-start-challenge')){startChallenge();return}
  if(target.hasAttribute('data-check-challenge')){submitChallenge(false);return}
  if(target.hasAttribute('data-reset-challenge')){dispatch({type:'RESET_CHALLENGE',id:challengeForState().id});return}
  if(target.hasAttribute('data-next-challenge')){dispatch({type:'NEXT_CHALLENGE'});return}
  if(target.hasAttribute('data-reset-challenges')){dispatch({type:'RESET_CHALLENGES'});return}
  if(target.dataset.nav){event.preventDefault();navigate(target.dataset.nav);return}
  if(target.hasAttribute('data-topic')){
    const id=target.dataset.topic||'';
    dispatch({type:'SELECT_TOPIC',id},{render:false});
    closeDrawer();navigate('index');return;
  }
  if(target.hasAttribute('data-clear-search')){dispatch({type:'SET_SEARCH',value:''});return}
  if(target.dataset.quiz){navigate('quiz/'+target.dataset.quiz);return}
  if(target.dataset.lesson){dispatch({type:'OPEN_LESSON',id:target.dataset.lesson},{render:false});navigate('lesson/'+target.dataset.lesson);return}
  if(target.hasAttribute('data-expression-trace-action')){const host=target.closest('[data-expression-trace]');if(host)renderExpressionTrace(host,Number(host.dataset.traceStep||0)+(target.dataset.expressionTraceAction==='next'?1:-1));return}
  if(target.hasAttribute('data-quiz-answer')){const topic=target.dataset.quizTopic;const question=target.dataset.quizQuestion;const value=target.dataset.quizValue;dispatch({type:'SET_QUIZ_ANSWER',topic,question:Number(question),answer:Number(value)});root.querySelector(`[data-quiz-answer][data-quiz-topic="${topic}"][data-quiz-question="${question}"][data-quiz-value="${value}"]`)?.focus();return}
  if(target.hasAttribute('data-submit-quiz')){dispatch({type:'SUBMIT_QUIZ',topic:target.dataset.quizTopic});return}
  if(target.hasAttribute('data-retake-quiz')){dispatch({type:'RETAKE_QUIZ',topic:target.dataset.quizTopic});return}
  if(target.hasAttribute('data-run-code')){runCurrent(false);return}
  if(target.hasAttribute('data-stop-sandbox')){stopSandbox();return}
  if(target.hasAttribute('data-run-portable')){runCurrent(true);return}
  if(target.hasAttribute('data-reset-code')){const lesson=currentLesson();dispatch({type:'RESET_CODE',id:lesson.id},{render:false});const editor=root.querySelector('[data-code-editor]');if(editor){editor.value=formatJavaScript(lesson.code);syncCodeEditor()}return}
  if(target.dataset.debugAnswer!==undefined){dispatch({type:'SET_DEBUG_ANSWER',id:currentLesson().id,answer:Number(target.dataset.debugAnswer)});return}
  if(target.hasAttribute('data-debug-reveal')){dispatch({type:'REVEAL_DEBUG',id:currentLesson().id});return}
  if(target.hasAttribute('data-import-node-metrics')){const input=root.querySelector('[data-node-metrics-input]');const host=root.querySelector('[data-actual-resource]');try{const parsed=JSON.parse(input?.value||'');dispatch({type:'SET_NODE_METRICS',id:currentLesson().id,value:parsed},{render:false});if(host)host.innerHTML=renderNodeMetrics(parsed)}catch(error){if(host)host.innerHTML=`<div class="actual-empty error"><strong>Invalid JSON.</strong><p>${escapeHtml(error.message)}</p></div>`}return}
});

root.addEventListener('input',event=>{
  const input=event.target;
  if(input.matches('[data-challenge-editor]')){syncCodeEditor();dispatch({type:'SET_CHALLENGE_CODE',id:challengeForState().id,value:input.value},{render:false});return}
  if(input.matches('[data-code-editor]')){syncCodeEditor();dispatch({type:'SET_CODE',id:currentLesson().id,value:input.value},{render:false});return}
  if(input.matches('[data-search]')){dispatch({type:'SET_SEARCH',value:input.value},{render:false});updateIndexRows();return}
});
root.addEventListener('scroll',event=>{
  const editor=event.target;
  if(!editor.matches?.('[data-code-editor]'))return;
  const gutter=root.querySelector('[data-code-gutter]');
  if(gutter)gutter.scrollTop=editor.scrollTop;
},true);
root.addEventListener('click',event=>{if(event.target.matches('[data-drawer-backdrop]'))closeDrawer()});
window.addEventListener('hashchange',()=>{renderApp();scrollToPageTop()});
window.addEventListener('keydown',event=>{if(handleEditorShortcut(event))return;if(event.key==='Escape')closeDrawer()});

async function removeLegacyWorkers(){
  if(!('serviceWorker'in navigator))return;
  try{
    const appScope=new URL('./',location.href).href;
    const regs=await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.filter(registration=>registration.scope===appScope).map(registration=>registration.unregister()));
  }catch{}
}
removeLegacyWorkers();
if(!location.hash)location.hash='home';else renderApp();
