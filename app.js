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

const CATEGORY_GUIDES = {
  fundamentals: {
    mentalModel:'Track ownership, allowed values and mutation. Most “simple variable” bugs are really ambiguity about who can change what and when.',
    useWhen:['Prefer the clearer form whenever state crosses a function, module or team boundary.'],
    avoidWhen:['Do not add abstraction only to rename a local value that is already obvious.'],
    tradeoffs:['More explicit code can be slightly longer, but it shrinks the number of states a reader must consider.'],
    tips:['Prefer the smallest useful scope.','Put units in names when they matter.','Treat external data as unknown until validated.']
  },
  functions: {
    mentalModel:'A function is easiest to reason about when inputs, outputs, effects and failure modes are visible from its interface.',
    useWhen:['Extract behavior when it creates a meaningful unit of reasoning, reuse or testing.'],
    avoidWhen:['Tiny wrappers that only move complexity elsewhere without naming a concept.'],
    tradeoffs:['Pure functions are easier to test; effectful functions are necessary but should expose the effect.'],
    tips:['Keep the happy path visible.','Preserve error context.','Bound concurrency and remote waits.']
  },
  classes: {
    mentalModel:'Use objects to protect invariants and coordinate stateful behavior—not simply because data has fields.',
    useWhen:['State and behavior belong together and the object can protect a meaningful invariant.'],
    avoidWhen:['Plain immutable records are enough.'],
    tradeoffs:['Encapsulation protects state, but deep object graphs and inheritance can hide coupling.'],
    tips:['Prefer composition for independent capabilities.','Make dependencies explicit.','Do not hide expensive I/O behind property syntax.']
  },
  collections: {
    mentalModel:'Choose a representation around the operations you do most often. The same data can have radically different cost depending on its structure.',
    useWhen:['Change structures when repeated access patterns justify the build or memory cost.'],
    avoidWhen:['Do not optimize a cold path without measuring realistic input sizes.'],
    tradeoffs:['Indexes/sets/maps spend memory to reduce repeated lookup work.','Streaming lowers peak memory but gives up some random access.'],
    tips:['Name the input sizes.','Count copies and round trips, not only loops.','Move invariant work out of repeated paths.']
  },
  web: {
    mentalModel:'Networked code is defined by latency, partial failure, duplication and concurrency—not just the happy-path response.',
    useWhen:['Make retries, timeouts, backpressure and protocol semantics explicit at every remote boundary.'],
    avoidWhen:['Do not add asynchronous infrastructure when simple synchronous request/response is enough.'],
    tradeoffs:['Concurrency can lower wall-clock latency while increasing simultaneous load.','Persistent connections remove request boundaries, so flow control becomes your job.'],
    tips:['Bound remote waits.','Design retries around idempotency.','Count synchronous hops in the critical path.']
  },
  security: {
    mentalModel:'Security-sensitive code begins at a trust boundary. Untrusted input stays untrusted until deterministic validation and authorization say otherwise.',
    useWhen:['Apply checks at every boundary where identity, data or authority changes.'],
    avoidWhen:['Never rely on client-side checks or model instructions as authorization.'],
    tradeoffs:['Stricter validation can reject malformed-but-benign input, so define contracts clearly.'],
    tips:['Parameterize, do not concatenate executable syntax.','Authorize the object/action, not merely the route.','Constrain destinations and dangerous sinks.']
  },
  ai: {
    mentalModel:'A model proposes. Deterministic application code owns state, authorization, validation and high-impact actions.',
    useWhen:['Use models where probabilistic interpretation or generation adds value; keep hard guarantees outside them.'],
    avoidWhen:['Do not store authoritative state only in prompts or trust model-controlled identity/permissions.'],
    tradeoffs:['Broader tools increase capability and blast radius.','More context can improve recall while increasing cost, latency and distraction.'],
    tips:['Treat retrieved text as untrusted.','Expose narrow tools.','Carry evidence and source identity through RAG.']
  },
  architecture: {
    mentalModel:'Architecture is the deliberate placement of boundaries, state, communication and failure domains to satisfy a workload.',
    useWhen:['Choose a style only after naming scale, latency, reliability, consistency, ownership and cost constraints.'],
    avoidWhen:['Do not choose architecture by trend or cloud product familiarity alone.'],
    tradeoffs:['Every boundary buys one kind of independence by introducing another kind of coordination.'],
    tips:['Draw the critical path.','Mark state ownership and failure domains.','State the operational cost of the design.']
  }
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
function guideFor(pattern) {
  const base = CATEGORY_GUIDES[pattern.category] || CATEGORY_GUIDES.fundamentals;
  return {
    mentalModel: pattern.mentalModel || base.mentalModel,
    useWhen: pattern.useWhen || base.useWhen,
    avoidWhen: pattern.avoidWhen || base.avoidWhen,
    tradeoffs: pattern.tradeoffs || base.tradeoffs,
    tips: pattern.tips || base.tips
  };
}

function drawer() {
  const links = [
    ['home','Learn','Focused lessons and progress'],
    ['library','Patterns',`${PATTERNS.length} sourced examples`],
    ['review','Review','Comprehensive fixed review']
  ];
  return `<div class="drawer-backdrop" data-drawer-backdrop></div>
    <aside class="drawer" aria-hidden="true" data-drawer>
      <div class="drawer-head">
        <div><p class="kicker">SWE Revision Labs</p><h2>Menu</h2></div>
        <button class="drawer-close" data-menu-close aria-label="Close menu">×</button>
      </div>
      <nav class="drawer-nav">
        ${links.map(([hash,title,desc],i)=>`<button data-nav="${hash}" style="--delay:${i*35}ms"><span>0${i+1}</span><b>${title}</b><small>${desc}</small><em>→</em></button>`).join('')}
      </nav>
      <div class="drawer-topics">
        <p class="kicker">Topics</p>
        ${CATEGORIES.map(c=>`<button data-category="${c.id}">${esc(c.title)}<span>${patternsFor(c.id).length}</span></button>`).join('')}
      </div>
    </aside>`;
}

function shell(content) {
  return `<div class="site">
    <header class="top">
      <button class="brand" data-nav="home" aria-label="Home">
        <span class="brand-mark"><i></i><i></i><i></i></span>
        <span>SWE Revision Labs</span>
      </button>
      <button class="menu-button" data-menu-open aria-label="Open menu"><span></span><span></span><span></span></button>
    </header>
    ${content}
    ${drawer()}
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
    <section class="intro reveal">
      <div>
        <p class="kicker">15–30 minutes</p>
        <h1>Pick one idea.<br>Leave understanding it.</h1>
        <p class="lead">Compare code, manipulate realistic inputs, follow the visual model, then inspect the trade-offs and source material.</p>
      </div>
      ${progressStrip()}
    </section>

    <section class="today-card reveal delay-1">
      <div class="today-top">
        <div>
          <span class="pill">Continue</span>
          <h2>${esc(next.title)}</h2>
          <p>${esc(cat?.title || '')} · ${next.languageAgnostic ? 'Architecture' : languageLabel()}</p>
        </div>
        <span class="arrow">→</span>
      </div>
      <div class="mini-flow" aria-hidden="true">
        <span>concept</span><b>→</b><span>compare</span><b>→</b><span>visualize</span><b>→</b><span>trade-offs</span>
      </div>
      <button class="primary-action" data-pattern="${next.id}">Open lesson</button>
    </section>

    <section class="section reveal delay-2">
      <div class="section-title"><h2>Topics</h2><button data-nav="library">See all</button></div>
      <div class="category-list">${categoryCards}</div>
    </section>

    <section class="quiet-card reveal delay-3">
      <p class="kicker">A complete lesson</p>
      <div class="four-steps">
        <div><span>1</span><strong>Understand</strong><small>Build the mental model.</small></div>
        <div><span>2</span><strong>Compare</strong><small>See poor vs better.</small></div>
        <div><span>3</span><strong>Visualize</strong><small>Change inputs and trace behavior.</small></div>
        <div><span>4</span><strong>Decide</strong><small>Know when and why.</small></div>
      </div>
    </section>
  </main>`);
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
        <small>Source: ${esc(source?.label || '')}</small>
      </span>
      <span class="status-dot ${state.comfortable[p.id]?'done':''}">${state.comfortable[p.id]?'✓':''}</span>
    </button>`;
  }).join('');

  return shell(`<main class="page library-page">
    <section class="library-head reveal">
      <p class="kicker">${PATTERNS.length} curated examples</p>
      <h1>Patterns</h1>
      <p class="lead">Every lesson links to the authoritative or practitioner source it was adapted from.</p>
    </section>
    <div class="topic-scroller reveal delay-1">${tabs}</div>
    <section class="pattern-list reveal delay-2">
      <div class="list-head"><strong>${esc(selected.title)}</strong><span>${items.length} lessons</span></div>
      ${cards}
    </section>
  </main>`);
}

function controlsFor(pattern, values) {
  const entries = Object.entries(pattern.inputs || {});
  if (!entries.length) {
    return `<div class="scenario-toggle" role="group" aria-label="Scenario">
      <button class="active" data-scenario="normal">Normal</button>
      <button data-scenario="edge">Stress / failure</button>
    </div>`;
  }
  return entries.map(([key,def]) => {
    if (typeof def === 'number') {
      const max = Math.max(def * 5, def + 10, 20);
      return `<label class="input-control">
        <span><b>${esc(key)}</b><output data-output="${key}">${values[key] ?? def}</output></span>
        <input type="range" min="1" max="${max}" value="${values[key] ?? def}" data-input="${key}">
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

function archNode(label, cls='') { return `<div class="arch-node ${cls}">${esc(label)}</div>`; }
function connector(label='→', animated=false) { return `<span class="arch-connector ${animated?'animated':''}">${label}</span>`; }

function architectureVisual(pattern, scenario) {
  const stressed = scenario === 'edge';
  switch (pattern.viz) {
    case 'arch-monolith':
      return `<div class="deploy-boundary ${stressed?'stress':''}"><span>one deployable</span><div class="module-grid">${['Orders','Payments','Inventory','Users'].map(x=>archNode(x)).join('')}</div></div><p class="viz-note">${stressed?'Stress case: one hot module can force scaling the whole deployable. Strong internal boundaries still keep extraction possible.':'Modules share a process/deployment boundary but communicate through explicit contracts.'}</p>`;
    case 'arch-microservices':
      return `<div class="arch-row center">${archNode('Client')}${connector()}${archNode('Gateway','dark')}</div><div class="service-grid">${['Orders','Payments','Inventory'].map((x,i)=>`<div>${archNode(x,stressed&&i===1?'stress':'')}${connector('↓',true)}${archNode(x+' DB','data')}</div>`).join('')}</div><p class="viz-note">${stressed?'Payments is failing: callers need timeouts, isolation and observability across service boundaries.':'Each service owns deployment and data; the price is distributed coordination.'}</p>`;
    case 'arch-event':
      return `<div class="arch-row center producers">${archNode('Producer A')}${archNode('Producer B')}</div>${connector('↓',true)}<div class="broker ${stressed?'stress':''}">Event broker <i></i></div>${connector('↓',true)}<div class="arch-row center consumers">${archNode('Email')}${archNode('Analytics')}${archNode('Loyalty')}</div><p class="viz-note">${stressed?'Stress case: one consumer is offline. Durable delivery, retries and replay policy decide what happens next.':'Producers publish facts without knowing every consumer.'}</p>`;
    case 'arch-queue':
      return `<div class="arch-row center">${archNode('Web')}${connector()}${archNode(stressed?'Queue: backlog ↑':'Queue','queue')}${connector()}${archNode(stressed?'Workers × 4':'Workers × 2','worker')}</div><div class="queue-dots">${Array.from({length:stressed?14:6},()=>'<i></i>').join('')}</div><p class="viz-note">The queue absorbs bursts; worker capacity determines drain rate.</p>`;
    case 'arch-sync-async':
      return `<div class="two-lanes"><div><strong>Synchronous path</strong><div class="arch-row">${archNode('Client')}${connector()}${archNode('Decision')}${connector()}${archNode('Response')}</div></div><div><strong>Asynchronous continuation</strong><div class="arch-row">${archNode('Event')}${connector()}${archNode('Broker')}${connector()}${archNode(stressed?'Consumer retry':'Consumer')}</div></div></div>`;
    case 'arch-compute':
      return `<div class="compute-grid">${[['VM','host control','you manage OS/runtime'],['Container','portable service','you manage image/orchestration'],['Function','event/request','provider manages servers']].map(([a,b,c],i)=>`<div class="${stressed&&i===2?'stress':''}"><b>${a}</b><span>${b}</span><small>${c}</small></div>`).join('')}</div><p class="viz-note">${stressed?'Stress case: a long-running/high-utilization workload can make per-invocation serverless economics or limits unattractive.':'Choose by workload shape, control needs and operations—not by platform fashion.'}</p>`;
    case 'arch-serverless':
      return `<div class="arch-row center">${archNode('Event')}${connector('',true)}${archNode('Function','function')}${connector()}${archNode('Managed state','data')}${connector()}${archNode('Next event')}</div><p class="viz-note">${stressed?'Failure/duplicate case: idempotency and durable orchestration decide whether repeated delivery is safe.':'Short-lived compute reacts to events while durable state lives outside the runtime.'}</p>`;
    case 'arch-k8s':
      return `<div class="k8s-box"><div class="control-plane">control plane · desired state</div><div class="node-grid">${[['Deployment','API replicas'],['StatefulSet','stable identity'],['DaemonSet','node agent'],['Job','run to completion']].map(([a,b])=>`<div><b>${a}</b><span>${b}</span></div>`).join('')}</div></div><p class="viz-note">${stressed?'A node disappears: controllers create replacement Pods according to workload semantics; durable storage/identity still need design.':'The controller contract—not the container image—defines lifecycle behavior.'}</p>`;
    case 'arch-state':
      return `<div class="state-compare"><div><b>Accidental local state</b>${archNode('Replica A: session')}${archNode(stressed?'Replica B: missing':'Replica B')}</div><div><b>External durable state</b><div class="arch-row">${archNode('Replica A')}${archNode('Replica B')}</div>${connector('↓')}${archNode('Shared state','data')}</div></div>`;
    case 'arch-cqrs':
      return `<div class="cqrs"><div class="arch-row">${archNode('Command')}${connector()}${archNode('Write model')}${connector()}${archNode('Write store','data')}</div><div class="projection-arrow">${connector('events / replication',true)}</div><div class="arch-row">${archNode('Query')}${connector()}${archNode(stressed?'Read model: lagging':'Read model')}${connector()}${archNode('Read store','data')}</div></div><p class="viz-note">The key trade-off is independent optimization versus synchronization/freshness complexity.</p>`;
    case 'arch-event-source':
      return `<div class="event-stream">${['OrderCreated','PaymentCaptured','Packed','Shipped'].map((x,i)=>`<div class="${stressed&&i===3?'stress':''}"><span>${i+1}</span>${x}</div>`).join('')}</div>${connector('↓ replay / project',true)}${archNode(stressed?'Projection needs rebuild':'Current order: SHIPPED','data')}`;
    case 'arch-gateway':
      return `<div class="arch-row center clients">${archNode('Web')}${archNode('Mobile')}</div>${connector('↓')}<div class="gateway ${stressed?'stress':''}">Gateway / BFF</div>${connector('↓')}<div class="service-grid small">${['Orders','Users','Search'].map(x=>archNode(x)).join('')}</div><p class="viz-note">${stressed?'Risk: domain logic accumulates here and turns the gateway into a new monolith.':'Keep edge composition/policy here; keep domain ownership behind it.'}</p>`;
    case 'arch-batch-stream':
      return `<div class="two-lanes"><div><strong>Batch</strong><div class="batch-box">${Array.from({length:8},()=>'<i></i>').join('')}<span>schedule → process chunk</span></div></div><div><strong>Stream</strong><div class="stream-box">${Array.from({length:8},()=>'<i></i>').join('')}<span>continuous events → continuous reaction</span></div></div></div><p class="viz-note">${stressed?'Late/out-of-order events force explicit event-time and replay rules in streaming systems.':'Start from freshness requirements; many mature systems use both.'}</p>`;
    case 'arch-cache':
      return `<div class="cache-flow"><div class="arch-row">${archNode('Request')}${connector()}${archNode(stressed?'Cache MISS':'Cache HIT','cache')}${connector()}${archNode(stressed?'Database':'Return','data')}</div>${stressed?'<div class="stampede">many simultaneous misses → origin pressure</div>':''}</div>`;
    case 'arch-big-compute':
      return `<div class="compute-fan"><div class="coordinator">partition</div>${connector('↓',true)}<div class="worker-grid">${Array.from({length:8},(_,i)=>`<i class="${stressed&&i>4?'idle':''}">W${i+1}</i>`).join('')}</div>${connector('↓ reduce') }<div class="coordinator">result</div></div><p class="viz-note">${stressed?'Serial work and communication cap speedup even when more workers exist.':'Parallel resources help only when enough useful work can run independently.'}</p>`;
    case 'arch-scale':
      return `<div class="scale-compare"><div><strong>Scale up</strong><div class="server tall">bigger server</div></div><div><strong>Scale out</strong><div class="replicas">${Array.from({length:stressed?6:3},()=>'<div class="server">replica</div>').join('')}</div></div></div><p class="viz-note">Horizontal scale adds distribution and state questions; vertical scale keeps a larger single failure domain.</p>`;
    default:
      return `<div class="arch-row center">${archNode('Input')}${connector('',true)}${archNode('Boundary')}${connector()}${archNode(stressed?'Failure path':'Outcome')}</div>`;
  }
}

function visual(pattern, values, scenario='normal') {
  if (pattern.category === 'architecture') return architectureVisual(pattern, scenario);
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
    </div><div class="authority-note">${scenario==='edge'?'Stress case: the model proposes a high-impact or adversarial action. Deterministic policy still owns authority.':'Normal case: model output is a proposal. Validation and authorization still happen outside the model.'}</div>`;
  }
  if (kind === 'boundary') {
    const raw = Object.values(values)[0] || (scenario==='edge' ? 'unexpected / hostile input' : 'normal input');
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

function list(items, cls='') {
  return `<ul class="${cls}">${items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`;
}

function videoCard(video) {
  if (!video) return '';
  return `<section class="video-card reveal">
    <div class="video-copy">
      <p class="kicker">Useful video</p>
      <h2>${esc(video.title)}</h2>
      <p>${esc(video.channel)} · ${esc(video.year)}${video.note ? ' · '+esc(video.note) : ''}</p>
    </div>
    <div class="video-frame">
      <iframe loading="lazy" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}" title="${esc(video.title)}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>
  </section>`;
}

function patternView(pattern) {
  const category = getCategory(pattern.category);
  const source = SOURCES[pattern.source];
  const values = getInputValues(pattern);
  const code = pattern.code[state.language] || pattern.code.javascript;
  const index = PATTERNS.findIndex(p => p.id === pattern.id);
  const next = nextPattern(pattern);
  const comfortable = !!state.comfortable[pattern.id];
  const guide = guideFor(pattern);

  return shell(`<main class="page pattern-page">
    <section class="pattern-head reveal">
      <button class="back-link" data-nav="library">← Patterns</button>
      <div class="pattern-position">${index+1} / ${PATTERNS.length}</div>
      <p class="kicker">${esc(category?.title || '')}</p>
      <h1>${esc(pattern.title)}</h1>
      <p class="lead">${esc(pattern.note)}</p>
      ${pattern.languageAgnostic ? '<span class="agnostic-label">Language agnostic</span>' : `<div class="language-switch" role="group" aria-label="Programming language">
        ${['typescript','javascript','python'].map(lang=>`<button data-language="${lang}" class="${state.language===lang?'active':''}">${({typescript:'TS',javascript:'JS',python:'PY'})[lang]}</button>`).join('')}
      </div>`}
    </section>

    <section class="mental-card reveal delay-1">
      <p class="kicker">Mental model</p>
      <h2>${esc(guide.mentalModel)}</h2>
      <div class="understand-strip">
        <span>problem</span><b>→</b><span>mechanism</span><b>→</b><span>cost</span><b>→</b><span>decision</span>
      </div>
    </section>

    <section class="code-story reveal delay-2">
      <article class="code-card poor">
        <header><span>Poor</span><a href="${source?.url || '#'}" target="_blank" rel="noreferrer">source ↗</a></header>
        <pre><code>${esc(code.bad)}</code></pre>
      </article>
      <div class="story-arrow">↓</div>
      <article class="code-card better">
        <header><span>Better</span><a href="${source?.url || '#'}" target="_blank" rel="noreferrer">source ↗</a></header>
        <pre><code>${esc(code.good)}</code></pre>
      </article>
    </section>

    <section class="sim-card reveal delay-3">
      <div class="sim-head">
        <div><p class="kicker">Under the hood</p><h2>${pattern.category==='architecture'?'Change the scenario':'Change the input'}</h2></div>
        <span class="sim-badge">interactive</span>
      </div>
      <div class="input-panel" id="input-panel">${controlsFor(pattern, values)}</div>
      <div class="visual-stage" id="visual-stage">${visual(pattern, values)}</div>
    </section>

    <section class="decision-grid reveal">
      <article class="decision-card">
        <p class="kicker">Use when</p>
        ${list(guide.useWhen)}
      </article>
      <article class="decision-card">
        <p class="kicker">Avoid / question when</p>
        ${list(guide.avoidWhen)}
      </article>
      <article class="decision-card wide">
        <p class="kicker">Trade-offs</p>
        ${list(guide.tradeoffs,'tradeoff-list')}
      </article>
      <article class="decision-card wide tips-card">
        <p class="kicker">Useful tips</p>
        ${list(guide.tips,'tips-list')}
      </article>
    </section>

    ${videoCard(pattern.video)}

    <section class="source-card reveal">
      <div>
        <p class="kicker">Reference for this example</p>
        <strong>${esc(source?.label || 'Reference')}</strong>
        <small>The code above is adapted into a compact teaching example; use the linked source for the full guidance.</small>
      </div>
      <a href="${source?.url || '#'}" target="_blank" rel="noreferrer">Open source ↗</a>
    </section>

    <section class="mastery-card reveal">
      <p class="kicker">Leave this lesson able to…</p>
      <div class="mastery-list">
        <label><input type="checkbox"><span>Explain the problem this pattern addresses without looking at the code.</span></label>
        <label><input type="checkbox"><span>Predict what changes when load, input size, failure or state changes.</span></label>
        <label><input type="checkbox"><span>Name at least one situation where the “better” version is not the right choice.</span></label>
        <label><input type="checkbox"><span>Explain the main trade-off in one or two sentences.</span></label>
      </div>
    </section>

    <section class="lesson-actions reveal">
      <button class="comfort-button ${comfortable?'on':''}" data-comfort="${pattern.id}">
        <span>${comfortable?'✓':'○'}</span>
        <b>${comfortable?'Comfortable':'Mark comfortable'}</b>
      </button>
      ${next ? `<button class="next-button" data-pattern="${next.id}" ${comfortable?'':'disabled'}>Next pattern →</button>` : `<button class="next-button" data-nav="review" ${comfortable?'':'disabled'}>Review →</button>`}
    </section>
  </main>`);
}

function review() {
  const q = state.quiz || defaults.quiz;
  if (q.completed) return reviewResults();
  const index = Math.min(q.current || 0, FINAL_QUIZ.length-1);
  const item = FINAL_QUIZ[index];
  const answer = q.answers[index];
  return shell(`<main class="page review-page">
    <section class="review-head reveal">
      <p class="kicker">Fixed comprehensive review</p>
      <h1>Question ${index+1}</h1>
      <p>${index+1} of ${FINAL_QUIZ.length}</p>
      <div class="progress-line"><span style="width:${pct(index+1,FINAL_QUIZ.length)}%"></span></div>
    </section>
    <section class="question-card reveal delay-1">
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
  </main>`);
}

function reviewResults() {
  let correct = 0;
  FINAL_QUIZ.forEach((item,index)=>{ if (state.quiz.answers[index] === item.answer) correct++; });
  const score = pct(correct,FINAL_QUIZ.length);
  return shell(`<main class="page review-page">
    <section class="result-card reveal">
      <p class="kicker">Review complete</p>
      <strong>${score}%</strong>
      <h1>${correct} / ${FINAL_QUIZ.length}</h1>
      <p>Use this as a revision signal. Reopen any topic where recall felt slow or uncertain.</p>
      <button class="primary-action" data-reset-review>Reset review</button>
    </section>
  </main>`);
}

function render() {
  const r = route();
  if (r.view === 'library') root.innerHTML = library();
  else if (r.view === 'pattern') root.innerHTML = patternView(getPattern(r.id) || firstIncomplete());
  else if (r.view === 'review') root.innerHTML = review();
  else root.innerHTML = home();
  bind();
}

function openDrawer() {
  const drawer = root.querySelector('[data-drawer]');
  const backdrop = root.querySelector('[data-drawer-backdrop]');
  if (!drawer || !backdrop) return;
  drawer.classList.add('open');
  backdrop.classList.add('open');
  drawer.setAttribute('aria-hidden','false');
  document.body.classList.add('drawer-open');
}
function closeDrawer() {
  const drawer = root.querySelector('[data-drawer]');
  const backdrop = root.querySelector('[data-drawer-backdrop]');
  if (!drawer || !backdrop) return;
  drawer.classList.remove('open');
  backdrop.classList.remove('open');
  drawer.setAttribute('aria-hidden','true');
  document.body.classList.remove('drawer-open');
}

function bind() {
  root.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', () => { closeDrawer(); go(el.dataset.nav); }));
  root.querySelector('[data-menu-open]')?.addEventListener('click', openDrawer);
  root.querySelector('[data-menu-close]')?.addEventListener('click', closeDrawer);
  root.querySelector('[data-drawer-backdrop]')?.addEventListener('click', closeDrawer);

  root.querySelectorAll('[data-category]').forEach(el => el.addEventListener('click', () => {
    state.category = el.dataset.category; save(); closeDrawer(); go('library');
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
      if (stage) {
        stage.classList.remove('visual-refresh');
        void stage.offsetWidth;
        stage.classList.add('visual-refresh');
        stage.innerHTML = visual(pattern, getInputValues(pattern));
      }
    }));
    root.querySelectorAll('[data-scenario]').forEach(button => button.addEventListener('click', () => {
      root.querySelectorAll('[data-scenario]').forEach(b => b.classList.toggle('active', b === button));
      const stage = root.querySelector('#visual-stage');
      if (stage) {
        stage.classList.remove('visual-refresh');
        void stage.offsetWidth;
        stage.classList.add('visual-refresh');
        stage.innerHTML = visual(pattern, getInputValues(pattern), button.dataset.scenario);
      }
    }));
  }
}

window.addEventListener('hashchange', render);
window.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeDrawer();
});
if (!location.hash) location.hash = 'home'; else render();
