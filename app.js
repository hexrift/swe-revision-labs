import { CATEGORIES, PATTERNS, SOURCES, getPattern, getCategory, patternsFor } from './patterns.js';
import { FINAL_QUIZ } from './quiz.js';

const root = document.querySelector('#app');
const STORE = 'swe-revision-labs:v7';

const defaults = {
  language: 'typescript',
  category: 'fundamentals',
  current: PATTERNS[0]?.id || '',
  comfortable: {},
  inputs: {},
  quiz: { current: 0, answers: {}, completed: false }
};

let state = load();

function load() {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(STORE) || '{}') }; }
  catch { return { ...defaults }; }
}
function save() { localStorage.setItem(STORE, JSON.stringify(state)); }
function esc(value='') {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function pct(a,b) { return b ? Math.round(a / b * 100) : 0; }
function doneCount() { return Object.values(state.comfortable).filter(Boolean).length; }
function route() {
  const raw = location.hash.slice(1) || 'home';
  const [view, id] = raw.split('/');
  return { view, id };
}
function go(value) { location.hash = value; }
function languageLabel() {
  return ({javascript:'JavaScript',typescript:'TypeScript',python:'Python'})[state.language] || 'TypeScript';
}
function firstIncomplete() {
  return PATTERNS.find(p => !state.comfortable[p.id]) || PATTERNS[0];
}
function nextPattern(pattern) {
  const index = PATTERNS.findIndex(p => p.id === pattern.id);
  return PATTERNS[index + 1] || null;
}

function shell(content, active='learn') {
  return `<div class="site">
    <header class="top">
      <button class="brand" data-nav="home" aria-label="Home">
        <span class="brand-mark"><i></i><i></i><i></i></span>
        <span>SWE Revision Labs</span>
      </button>
      <button class="menu-button" data-nav="library" aria-label="Open pattern library">☰</button>
    </header>
    ${content}
    <nav class="bottom-nav" aria-label="Primary">
      <button class="${active==='learn'?'active':''}" data-nav="home"><span>⌂</span>Learn</button>
      <button class="${active==='patterns'?'active':''}" data-nav="library"><span>▦</span>Patterns</button>
      <button class="${active==='review'?'active':''}" data-nav="review"><span>✓</span>Review</button>
    </nav>
  </div>`;
}

function progressStrip() {
  const done = doneCount();
  return `<div class="progress-strip" aria-label="${done} of ${PATTERNS.length} comfortable">
    <div class="progress-label"><span>Progress</span><strong>${done}/${PATTERNS.length}</strong></div>
    <div class="progress-line"><span style="width:${pct(done,PATTERNS.length)}%"></span></div>
  </div>`;
}

function home() {
  const next = firstIncomplete();
  const cat = getCategory(next.category);
  const categoryCards = CATEGORIES.map(category => {
    const items = patternsFor(category.id);
    const done = items.filter(p => state.comfortable[p.id]).length;
    return `<button class="category-card" data-category="${category.id}">
      <span class="category-number">${category.icon}</span>
      <span class="category-copy"><strong>${esc(category.title)}</strong><small>${esc(category.description)}</small></span>
      <span class="category-progress">${done}/${items.length}</span>
    </button>`;
  }).join('');

  return shell(`<main class="page home-page">
    <section class="intro">
      <div>
        <p class="kicker">15–30 minutes</p>
        <h1>Small lessons.<br>Clear mental models.</h1>
        <p class="lead">Compare code, change the inputs, and watch what the runtime or system is doing underneath.</p>
      </div>
      ${progressStrip()}
    </section>

    <section class="today-card">
      <div class="today-top">
        <div>
          <span class="pill">Continue</span>
          <h2>${esc(next.title)}</h2>
          <p>${esc(cat?.title || '')} · ${languageLabel()}</p>
        </div>
        <span class="arrow">→</span>
      </div>
      <div class="mini-flow" aria-hidden="true">
        <span>input</span><b>→</b><span>code</span><b>→</b><span>under the hood</span>
      </div>
      <button class="primary-action" data-pattern="${next.id}">Open lesson</button>
    </section>

    <section class="section">
      <div class="section-title"><h2>Topics</h2><button data-nav="library">See all</button></div>
      <div class="category-list">${categoryCards}</div>
    </section>

    <section class="quiet-card">
      <p class="kicker">How it works</p>
      <div class="three-steps">
        <div><span>1</span><strong>Compare</strong><small>Poor vs better code.</small></div>
        <div><span>2</span><strong>Change</strong><small>Adjust real inputs.</small></div>
        <div><span>3</span><strong>See</strong><small>Watch work, state or flow change.</small></div>
      </div>
    </section>
  </main>`, 'learn');
}

function library() {
  const selected = getCategory(state.category) || CATEGORIES[0];
  const tabs = CATEGORIES.map(c => `<button class="topic-chip ${c.id===selected.id?'active':''}" data-category="${c.id}">${esc(c.title)}</button>`).join('');
  const items = patternsFor(selected.id);
  const cards = items.map((p,index) => {
    const source = SOURCES[p.source];
    return `<button class="pattern-row" data-pattern="${p.id}">
      <span class="pattern-index">${String(index+1).padStart(2,'0')}</span>
      <span class="pattern-main">
        <strong>${esc(p.title)}</strong>
        <small>${esc(source?.label || '')}</small>
      </span>
      <span class="status-dot ${state.comfortable[p.id]?'done':''}">${state.comfortable[p.id]?'✓':''}</span>
    </button>`;
  }).join('');

  return shell(`<main class="page library-page">
    <section class="library-head">
      <p class="kicker">${PATTERNS.length} curated examples</p>
      <h1>Code patterns</h1>
      <p class="lead">Poor and better versions, adapted from reputable engineering guidance and standards.</p>
    </section>
    <div class="topic-scroller">${tabs}</div>
    <section class="pattern-list">
      <div class="list-head"><strong>${esc(selected.title)}</strong><span>${items.length} examples</span></div>
      ${cards}
    </section>
  </main>`, 'patterns');
}

function controlsFor(pattern, values) {
  const entries = Object.entries(pattern.inputs || {});
  if (!entries.length) {
    return `<div class="scenario-toggle" role="group" aria-label="Scenario">
      <button class="active" data-scenario="normal">Normal</button>
      <button data-scenario="edge">Edge case</button>
    </div>`;
  }
  return entries.map(([key,def]) => {
    if (typeof def === 'number') {
      const max = Math.max(def * 5, def + 10, 20);
      const min = 1;
      return `<label class="input-control">
        <span><b>${esc(key)}</b><output data-output="${key}">${values[key] ?? def}</output></span>
        <input type="range" min="${min}" max="${max}" value="${values[key] ?? def}" data-input="${key}">
      </label>`;
    }
    return `<label class="text-control">
      <span>${esc(key)}</span>
      <input type="text" value="${esc(values[key] ?? def)}" data-input="${key}">
    </label>`;
  }).join('');
}

function getInputValues(pattern) {
  const existing = state.inputs[pattern.id] || {};
  const result = {};
  for (const [key,def] of Object.entries(pattern.inputs || {})) result[key] = existing[key] ?? def;
  return result;
}

function logScale(value, maxValue) {
  if (value <= 0 || maxValue <= 0) return 0;
  return Math.max(4, Math.min(100, Math.log10(value + 1) / Math.log10(maxValue + 1) * 100));
}

function costNumbers(pattern, v) {
  const n = Number(v.n || v.items || v.rows || v.messages || 100);
  const m = Number(v.m || n);
  const q = Number(v.lookups || v.queries || 1);
  switch (pattern.id) {
    case 'membership-set': return { bad:n*m, good:n+m, label:'comparisons / indexing work' };
    case 'queue-front': return { bad:n*(n+1)/2, good:n, label:'element moves / reads' };
    case 'repeated-copy': return { bad:n*(n+1)/2, good:n, label:'elements copied / appended' };
    case 'sort-once': return { bad:q*n*Math.log2(Math.max(n,2)), good:n*Math.log2(Math.max(n,2))+q, label:'comparison work' };
    case 'map-for-keyed': return { bad:n*q, good:n+q, label:'lookup work' };
    case 'dedupe-set': return { bad:n*(n+1)/2, good:n, label:'membership work' };
    case 'regex-dos': return { bad:Math.pow(2,Math.min(n,30)), good:n, label:'illustrative work units' };
    default: return { bad:n*n, good:n, label:'illustrative work units' };
  }
}

function visual(pattern, values, scenario='normal') {
  const kind = pattern.viz;
  if (kind === 'cost') {
    const c = costNumbers(pattern, values);
    const max = Math.max(c.bad,c.good);
    return `<div class="viz-caption"><strong>${esc(c.label)}</strong><span>Illustrative, not a benchmark</span></div>
      <div class="bar-compare">
        <div><span>Poor</span><b style="width:${logScale(c.bad,max)}%"></b><em>${Math.round(c.bad).toLocaleString()}</em></div>
        <div><span>Better</span><b style="width:${logScale(c.good,max)}%"></b><em>${Math.round(c.good).toLocaleString()}</em></div>
      </div>
      <p class="viz-note">As the input grows, the repeated operation is what changes the shape of the cost.</p>`;
  }
  if (kind === 'allocation') {
    const n = Number(values.n || 100);
    const bad = Math.round(n*(n+1)/2);
    return `<div class="memory-visual">
      <div><span>Poor</span><div class="memory-cells">${Array.from({length:12},(_,i)=>`<i class="${i<11?'filled':''}"></i>`).join('')}</div><strong>~${bad.toLocaleString()} copied items</strong></div>
      <div><span>Better</span><div class="memory-cells">${Array.from({length:12},(_,i)=>`<i class="${i<4?'filled':''}"></i>`).join('')}</div><strong>~${n.toLocaleString()} appends</strong></div>
    </div><p class="viz-note">The poor version repeatedly allocates a new growing container.</p>`;
  }
  if (kind === 'timeline') {
    const task = Number(values.taskMs || 100);
    const items = Number(values.items || 3);
    const limit = Number(values.limit || Math.min(3,items));
    const serial = task * items;
    const parallel = task * Math.ceil(items / Math.max(limit,1));
    return `<div class="timeline">
      <div class="timeline-row"><span>Poor</span><div class="track">${Array.from({length:Math.min(items,8)},(_,i)=>`<i style="left:${i*(100/Math.min(items,8))}%;width:${100/Math.min(items,8)}%"></i>`).join('')}</div><b>~${serial} ms</b></div>
      <div class="timeline-row"><span>Better</span><div class="track compact">${Array.from({length:Math.min(items,8)},(_,i)=>`<i style="left:${(i%limit)*(100/limit)}%;top:${Math.floor(i/limit)*8}px;width:${100/limit}%"></i>`).join('')}</div><b>~${parallel} ms</b></div>
    </div><p class="viz-note">Illustrative wall-clock model for independent tasks. Real latency includes scheduling and downstream limits.</p>`;
  }
  if (kind === 'recursion') {
    const n = Number(values.n || 12);
    const calls = Math.min(1000000, Math.round(Math.pow(1.618,n)));
    return `<div class="recursion-grid">
      <div><span>Poor</span><strong>${calls.toLocaleString()}</strong><small>repeated recursive calls</small><div class="tree">${Array.from({length:15},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div></div>
      <div><span>Better</span><strong>${n+1}</strong><small>distinct states cached</small><div class="state-row">${Array.from({length:Math.min(n+1,12)},()=>'<i></i>').join('')}</div></div>
    </div>`;
  }
  if (kind === 'network') {
    const n = Number(values.n || 50);
    const latency = Number(values.latency || 20);
    return `<div class="request-stack">
      <div class="request-bad"><span>1</span>${Array.from({length:Math.min(n,9)},(_,i)=>`<i>${i+2}</i>`).join('')}<b>≈ ${(n+1)*latency} ms serial latency</b></div>
      <div class="request-good"><span>1</span><i>2</i><b>≈ 2 round trips</b></div>
    </div><p class="viz-note">N+1 is often a network problem before it is a CPU problem.</p>`;
  }
  if (kind === 'protocol') {
    const failures = Number(values.failures || values.retries || 2);
    return `<div class="protocol-flow">
      <div class="lane"><strong>Poor</strong><span>client</span><b>→</b><span>request</span><b>→</b><span class="danger">retry × ${failures+1}</span></div>
      <div class="lane"><strong>Better</strong><span>client</span><b>→</b><span>policy</span><b>→</b><span class="safe">bounded action</span></div>
    </div><p class="viz-note">Protocol correctness is often about what happens after timeout, retry, reconnect or duplication.</p>`;
  }
  if (kind === 'agent') {
    return `<div class="agent-flow">
      <div class="agent-node">Untrusted input</div><b>→</b><div class="agent-node">Model</div><b>→</b><div class="agent-node boundary">Policy boundary</div><b>→</b><div class="agent-node action">Tool / state</div>
    </div><div class="authority-note">${scenario==='edge'?'Edge case: the model proposes a high-impact or adversarial action. Deterministic policy still owns authority.':'Normal case: model output is a proposal. Validation and authorization still happen outside the model.'}</div>`;
  }
  if (kind === 'boundary') {
    const raw = Object.values(values)[0] || (scenario==='edge' ? "unexpected / hostile input" : "normal input");
    return `<div class="boundary-viz">
      <div class="boundary-input"><small>input</small><strong>${esc(raw)}</strong></div>
      <div class="boundary-path bad"><span>poor</span><b>→</b><em>trusted immediately</em><b>→</b><strong>sink</strong></div>
      <div class="boundary-path good"><span>better</span><b>→</b><em>parse + validate + authorize</em><b>→</b><strong>sink</strong></div>
    </div>`;
  }
  if (kind === 'state' || kind === 'binding' || kind === 'scope' || kind === 'object') {
    return `<div class="object-viz">
      <div class="object-card"><small>caller</small><strong>A</strong></div><b>→</b>
      <div class="object-card shared"><small>state</small><strong>${kind==='binding'?'binding':'object'}</strong><span>${scenario==='edge'?'changed unexpectedly':'explicit ownership'}</span></div><b>→</b>
      <div class="object-card"><small>result</small><strong>B</strong></div>
    </div><p class="viz-note">The key question is who owns the state and who is allowed to change it.</p>`;
  }
  return `<div class="flow-viz">
    <div class="flow-row bad"><span>Poor</span><i>input</i><b>→</b><i>hidden step</i><b>→</b><i>surprise</i></div>
    <div class="flow-row good"><span>Better</span><i>input</i><b>→</b><i>explicit step</i><b>→</b><i>clear result</i></div>
  </div>`;
}

function patternView(pattern) {
  const category = getCategory(pattern.category);
  const source = SOURCES[pattern.source];
  const values = getInputValues(pattern);
  const code = pattern.code[state.language] || pattern.code.javascript;
  const index = PATTERNS.findIndex(p => p.id === pattern.id);
  const next = nextPattern(pattern);
  const comfortable = !!state.comfortable[pattern.id];

  return shell(`<main class="page pattern-page">
    <section class="pattern-head">
      <button class="back-link" data-nav="library">← Patterns</button>
      <div class="pattern-position">${index+1} / ${PATTERNS.length}</div>
      <p class="kicker">${esc(category?.title || '')}</p>
      <h1>${esc(pattern.title)}</h1>
      <p class="lead">${esc(pattern.note)}</p>
      <div class="language-switch" role="group" aria-label="Programming language">
        ${['typescript','javascript','python'].map(lang=>`<button data-language="${lang}" class="${state.language===lang?'active':''}">${({typescript:'TS',javascript:'JS',python:'PY'})[lang]}</button>`).join('')}
      </div>
    </section>

    <section class="code-story">
      <article class="code-card poor">
        <header><span>Poor</span><small>more risk / work / ambiguity</small></header>
        <pre><code>${esc(code.bad)}</code></pre>
      </article>
      <div class="story-arrow">↓</div>
      <article class="code-card better">
        <header><span>Better</span><small>clearer intent and trade-offs</small></header>
        <pre><code>${esc(code.good)}</code></pre>
      </article>
    </section>

    <section class="sim-card">
      <div class="sim-head">
        <div><p class="kicker">Under the hood</p><h2>Change the input</h2></div>
        <span class="sim-badge">interactive</span>
      </div>
      <div class="input-panel" id="input-panel">${controlsFor(pattern, values)}</div>
      <div class="visual-stage" id="visual-stage">${visual(pattern, values)}</div>
    </section>

    <section class="source-card">
      <div><p class="kicker">Source</p><strong>${esc(source?.label || 'Reference')}</strong></div>
      <a href="${source?.url || '#'}" target="_blank" rel="noreferrer">Open ↗</a>
    </section>

    <section class="lesson-actions">
      <button class="comfort-button ${comfortable?'on':''}" data-comfort="${pattern.id}">
        <span>${comfortable?'✓':'○'}</span>
        <b>${comfortable?'Comfortable':'Mark comfortable'}</b>
      </button>
      ${next ? `<button class="next-button" data-pattern="${next.id}" ${comfortable?'':'disabled'}>Next pattern →</button>` : `<button class="next-button" data-nav="review" ${comfortable?'':'disabled'}>Review →</button>`}
    </section>
  </main>`, 'patterns');
}

function review() {
  const q = state.quiz || defaults.quiz;
  if (q.completed) return reviewResults();
  const index = Math.min(q.current || 0, FINAL_QUIZ.length-1);
  const item = FINAL_QUIZ[index];
  const answer = q.answers[index];
  return shell(`<main class="page review-page">
    <section class="review-head">
      <p class="kicker">Fixed comprehensive review</p>
      <h1>Question ${index+1}</h1>
      <p>${index+1} of ${FINAL_QUIZ.length}</p>
      <div class="progress-line"><span style="width:${pct(index+1,FINAL_QUIZ.length)}%"></span></div>
    </section>
    <section class="question-card">
      <small>${esc(getCategory(item.topic)?.title || item.topic)}</small>
      <h2>${esc(item.question)}</h2>
      <div class="answers">
        ${item.options.map((option,i)=>`<button class="${answer===i?'selected':''}" data-answer="${i}"><span>${String.fromCharCode(65+i)}</span>${esc(option)}</button>`).join('')}
      </div>
      <div class="review-nav">
        <button data-question="${Math.max(0,index-1)}" ${index===0?'disabled':''}>←</button>
        ${index === FINAL_QUIZ.length-1
          ? `<button class="primary-action" data-submit ${Object.keys(q.answers||{}).length<FINAL_QUIZ.length?'disabled':''}>Finish</button>`
          : `<button class="primary-action" data-question="${index+1}">Next →</button>`}
      </div>
    </section>
  </main>`, 'review');
}

function reviewResults() {
  let correct = 0;
  FINAL_QUIZ.forEach((item,index)=>{ if (state.quiz.answers[index] === item.answer) correct++; });
  const score = pct(correct,FINAL_QUIZ.length);
  return shell(`<main class="page review-page">
    <section class="result-card">
      <p class="kicker">Review complete</p>
      <strong>${score}%</strong>
      <h1>${correct} / ${FINAL_QUIZ.length}</h1>
      <p>Use this as a revision signal. Reopen any topic where recall felt slow or uncertain.</p>
      <button class="primary-action" data-reset-review>Reset review</button>
    </section>
  </main>`, 'review');
}

function render() {
  const r = route();
  if (r.view === 'library') root.innerHTML = library();
  else if (r.view === 'pattern') root.innerHTML = patternView(getPattern(r.id) || firstIncomplete());
  else if (r.view === 'review') root.innerHTML = review();
  else root.innerHTML = home();
  bind();
}

function bind() {
  root.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', () => go(el.dataset.nav)));
  root.querySelectorAll('[data-category]').forEach(el => el.addEventListener('click', () => {
    state.category = el.dataset.category; save(); go('library');
  }));
  root.querySelectorAll('[data-pattern]').forEach(el => el.addEventListener('click', () => {
    state.current = el.dataset.pattern; save(); go('pattern/' + el.dataset.pattern);
  }));
  root.querySelectorAll('[data-language]').forEach(el => el.addEventListener('click', () => {
    state.language = el.dataset.language; save(); render();
  }));
  root.querySelectorAll('[data-comfort]').forEach(el => el.addEventListener('click', () => {
    const id = el.dataset.comfort;
    state.comfortable[id] = !state.comfortable[id];
    save(); render();
  }));
  root.querySelectorAll('[data-answer]').forEach(el => el.addEventListener('click', () => {
    state.quiz.answers[state.quiz.current || 0] = Number(el.dataset.answer);
    save(); render();
  }));
  root.querySelectorAll('[data-question]').forEach(el => el.addEventListener('click', () => {
    state.quiz.current = Number(el.dataset.question); save(); render();
  }));
  root.querySelector('[data-submit]')?.addEventListener('click', () => {
    state.quiz.completed = true; save(); render();
  });
  root.querySelector('[data-reset-review]')?.addEventListener('click', () => {
    state.quiz = { current:0, answers:{}, completed:false }; save(); render();
  });

  const patternRoute = route();
  if (patternRoute.view === 'pattern') {
    const pattern = getPattern(patternRoute.id) || firstIncomplete();
    const inputs = root.querySelectorAll('[data-input]');
    inputs.forEach(input => input.addEventListener('input', () => {
      const key = input.dataset.input;
      const value = input.type === 'range' ? Number(input.value) : input.value;
      state.inputs[pattern.id] ||= {};
      state.inputs[pattern.id][key] = value;
      save();
      const out = root.querySelector('[data-output="' + key + '"]');
      if (out) out.textContent = String(value);
      const stage = root.querySelector('#visual-stage');
      if (stage) stage.innerHTML = visual(pattern, getInputValues(pattern));
    }));
    root.querySelectorAll('[data-scenario]').forEach(button => button.addEventListener('click', () => {
      root.querySelectorAll('[data-scenario]').forEach(b => b.classList.toggle('active', b === button));
      const stage = root.querySelector('#visual-stage');
      if (stage) stage.innerHTML = visual(pattern, getInputValues(pattern), button.dataset.scenario);
    }));
  }
}

window.addEventListener('hashchange', render);
if (!location.hash) location.hash = 'home'; else render();
