const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

const DIAGRAMS = {
  queue: { title:'Backpressure', nodes:[['Producer',70,145],['Queue',245,145],['Workers',420,145],['Dependency',595,145]], note:'Fast producer → bounded buffer → finite consumers' },
  nplusone: { title:'Round trips are work', nodes:[['API',70,145],['Users query',225,100],['N child queries',390,190],['Database',580,145]], note:'Prefer batching / joins / data-loader patterns over one remote call per item' },
  structures: { title:'Choose by the operation', nodes:[['Array',80,70],['Set / Map',260,70],['Deque',440,70],['Heap',170,220],['Tree / Graph',380,220]], note:'Indexed access • membership • ends • priority • relationships' },
  sorting: { title:'Order buys structure', nodes:[['Unordered input',80,145],['Sort O(n log n)',270,145],['Binary search / scan',490,145]], note:'Pay once for order when downstream work benefits repeatedly' },
  graph: { title:'Traversal state', nodes:[['A',90,145],['B',230,70],['C',230,220],['D',390,70],['E',390,220],['F',550,145]], note:'Track visited state; complexity is typically expressed in V and E' },
  race: { title:'Read → modify → write', nodes:[['Worker A reads 7',110,80],['Worker B reads 7',110,215],['A writes 8',360,80],['B writes 8',360,215],['Lost update',585,145]], note:'Protect the invariant across the whole transition' },
  requirements: { title:'Design starts with constraints', nodes:[['Users & actions',80,145],['Scale & data',245,145],['SLOs',400,80],['Consistency',400,210],['Architecture',590,145]], note:'Architecture is the result of constraints, not the first step' },
  cache: { title:'Cache-aside path', nodes:[['Client',70,145],['API',210,145],['Cache',385,80],['Database',550,210]], note:'Hit is fast; miss fetches and populates; invalidation is the hard part' },
  consistency: { title:'Replica visibility over time', nodes:[['Write v2',80,145],['Leader v2',240,145],['Replica A v1→v2',430,80],['Replica B v1→v2',430,210],['Converged',610,145]], note:'Eventual consistency allows temporary divergence, then convergence' },
  replication: { title:'Leader / followers', nodes:[['Client write',70,145],['Leader',245,145],['Follower A',450,80],['Follower B',450,210],['Reads',625,145]], note:'Acknowledgement policy determines latency and durability/freshness trade-offs' },
  saga: { title:'Distributed workflow', nodes:[['Reserve',70,145],['Charge',235,145],['Ship',395,145],['Notify',555,145]], note:'Each local step needs retry semantics and a compensation/reconciliation story' },
  modules: { title:'Change should stay local', nodes:[['Domain policy',230,145],['Port',410,85],['Port',410,205],['DB adapter',575,85],['HTTP adapter',575,205]], note:'High cohesion inside; explicit, narrow dependencies outside' },
  architecture: { title:'Deployment boundaries', nodes:[['Module A',130,90],['Module B',130,210],['One process',330,145],['Service A',515,80],['Service B',515,210]], note:'Microservices exchange process coupling for network + operational complexity' },
  cqrs: { title:'Separate models deliberately', nodes:[['Command',70,90],['Write model',250,90],['Events',410,145],['Projection',535,145],['Read model',250,220],['Query',70,220]], note:'CQRS may create eventual consistency between write and read views' },
  http: { title:'HTTP request lifecycle', nodes:[['Client',60,145],['DNS/TLS',205,145],['Gateway',350,145],['App',495,145],['Response + cache',650,145]], note:'Method semantics, status, validators and retry behaviour are part of the API design' },
  realtime: { title:'Real-time choices', nodes:[['Browser',80,145],['Polling',260,55],['SSE',260,145],['WebSocket',260,235],['Server',555,145]], note:'Choose by directionality, latency, connection state and operational cost' },
  networkStack: { title:'Layered request path', nodes:[['DNS name',70,145],['IP route',210,145],['TCP',345,145],['TLS',475,145],['HTTP/gRPC',620,145]], note:'Each layer solves a different problem; none replaces application authorization' },
  btree: { title:'Index narrows the search', nodes:[['Root keys',350,45],['Range A',160,145],['Range B',350,145],['Range C',540,145],['Rows',350,245]], note:'Tree depth grows logarithmically; returned row count still matters' },
  transactions: { title:'Concurrent histories', nodes:[['Txn A snapshot',90,80],['Txn B snapshot',90,220],['Versions / locks',330,145],['Commit checks',520,145]], note:'Isolation is about which concurrent outcomes are permitted' },
  partition: { title:'Partition by key', nodes:[['Requests',80,145],['Hash/range',245,145],['Shard 1',450,55],['Shard 2',450,145],['Shard 3',450,235]], note:'A good key spreads load and keeps common operations local' },
  securityBoundary: { title:'Interpretation boundaries', nodes:[['Untrusted input',70,145],['Validation',235,145],['Safe API',400,145],['SQL / HTML / shell sink',600,145]], note:'Keep data as data; use parameterisation and context-specific encoding' },
  auth: { title:'Every request crosses policy', nodes:[['Credential',70,145],['Authenticate',240,145],['Identity',390,80],['Authorize action+resource',515,145],['Resource',690,145]], note:'Identity is not permission; object-level checks belong server-side' },
  ssrf: { title:'Outbound capability is authority', nodes:[['User URL',70,145],['Parser + policy',245,145],['Egress control',420,145],['Public target',610,80],['Internal target ✕',610,215]], note:'Application checks + network egress restrictions create defense in depth' },
  slo: { title:'Reliability contract', nodes:[['SLI measurement',90,145],['SLO target',285,145],['Error budget',470,145],['Release / reliability decision',655,145]], note:'Measure user-visible behaviour, then use budget burn to guide trade-offs' },
  retries: { title:'Retry safely', nodes:[['Call',70,145],['Timeout?',210,145],['Classify',350,145],['Backoff + jitter',495,145],['Retry / stop',665,145]], note:'Retries are extra traffic; bound and classify them' },
  trace: { title:'One request across services', nodes:[['Client',60,145],['API 42ms',210,145],['Catalog 18ms',370,80],['Payments 310ms',370,210],['DB 260ms',565,210]], note:'Traces locate latency across boundaries; metrics detect; logs explain details' },
  testPyramid: { title:'Confidence layers', nodes:[['Unit',350,55],['Integration',350,145],['Contract',180,225],['E2E',520,225]], note:'Choose the narrowest layer that proves the risk; broader tests cost more' },
  pipeline: { title:'Small reversible changes', nodes:[['Commit',60,145],['CI',190,145],['Deploy',325,145],['Canary',460,145],['Observe',585,145],['Expand / rollback',710,145]], note:'Deployment safety comes from small batches, telemetry and reversibility' },
  fuzz: { title:'Generate → check invariant → shrink', nodes:[['Generator',90,145],['System under test',280,145],['Invariant',470,145],['Minimal counterexample',660,145]], note:'Property tests explore broad input spaces while preserving a precise oracle' },
  llmPipeline: { title:'LLM inside deterministic boundaries', nodes:[['User input',70,145],['Context builder',235,145],['Model',390,145],['Schema validation',530,145],['Policy / state',690,145]], note:'Keep authoritative state and irreversible decisions outside probabilistic text generation' },
  rag: { title:'RAG has multiple quality gates', nodes:[['Query',55,145],['Retrieve',195,145],['Rerank/filter',345,145],['Context',495,145],['Generate',630,145]], note:'Diagnose retrieval separately from generation' },
  mcp: { title:'MCP capability path', nodes:[['AI host',70,145],['MCP client',220,145],['MCP server',385,145],['Policy/auth',535,80],['Tool/resource',650,145]], note:'Capability discovery ≠ authorization. Keep user authority in trusted context.' },
  promptInjection: { title:'Instruction/data boundary', nodes:[['Trusted intent',80,80],['Untrusted content',80,220],['Model proposal',315,145],['Deterministic policy',500,145],['Scoped tool',680,145]], note:'Untrusted content may influence proposals, but must not grant authority' },
};

function genericDiagram(kind) {
  const d = DIAGRAMS[kind] || DIAGRAMS.modules;
  const nodes = d.nodes.map(([name,x,y], i) => `<g class="diagram-node" data-node="${i}"><rect class="node" x="${x-62}" y="${y-24}" width="124" height="48" rx="12"/><text x="${x}" y="${y+4}" text-anchor="middle">${esc(name)}</text></g>`).join('');
  const edges = d.nodes.slice(0,-1).map((n,i) => {
    const a=n, b=d.nodes[i+1];
    return `<path class="edge" data-edge="${i}" d="M ${a[1]+62} ${a[2]} C ${a[1]+100} ${a[2]}, ${b[1]-100} ${b[2]}, ${b[1]-62} ${b[2]}"/>`;
  }).join('');
  return `<div class="visual-head"><h3>${esc(d.title)}</h3><span>animated mental model</span></div><div class="visual-canvas"><svg class="diagram" viewBox="0 0 760 290" role="img" aria-label="${esc(d.title)}">${edges}${nodes}</svg><div class="callout">${esc(d.note)}</div></div>`;
}

function growthVisual() {
  return `<div class="visual-head"><h3>Growth race</h3><span>drag n and watch relative work explode</span></div>
  <div class="visual-canvas">
    <div class="growth-chart" id="growth-chart"></div>
    <div class="legend" id="growth-legend"></div>
    <div class="visual-control-row"><span style="font-size:11px;color:var(--muted)">n = <b id="growth-n">32</b></span><input class="range" id="growth-range" type="range" min="4" max="80" value="32"></div>
    <div class="callout" id="growth-copy"></div>
  </div>`;
}

function memoryVisual() {
  return `<div class="visual-head"><h3>Where does memory grow?</h3><span>input vs auxiliary vs stack</span></div>
  <div class="visual-canvas"><div class="memory-grid" id="memory-grid"></div><div class="visual-control-row"><input class="range" id="memory-range" type="range" min="2" max="16" value="8"></div><div class="callout" id="memory-copy"></div></div>`;
}

function amortizedVisual() {
  return `<div class="visual-head"><h3>Dynamic-array resize</h3><span>occasional expensive copy, cheap sequence overall</span></div><div class="visual-canvas"><div id="array-slots" class="memory-grid"></div><div class="visual-control-row"><button class="mini-btn" id="append-btn">Append one item</button><button class="mini-btn" id="append-reset">Reset</button></div><div class="callout" id="append-copy"></div></div>`;
}

function recursionVisual() {
  return `<div class="visual-head"><h3>Repeated subproblems</h3><span>naive recursion vs memoization</span></div><div class="visual-canvas"><svg class="diagram" id="recursion-svg" viewBox="0 0 760 290"></svg><div class="visual-control-row"><button class="mini-btn active" data-rec="naive">Naive</button><button class="mini-btn" data-rec="memo">Memoized</button></div><div class="callout" id="recursion-copy"></div></div>`;
}

function eventLoopVisual() {
  return `<div class="visual-head"><h3>Event-loop pressure</h3><span>CPU work blocks; async waiting yields</span></div><div class="visual-canvas"><svg class="diagram" id="event-svg" viewBox="0 0 760 290"><text x="28" y="55">Event loop</text><text x="28" y="145">I/O</text><text x="28" y="235">Worker / OS</text><rect class="node" x="120" y="30" width="145" height="42" rx="10"/><text x="192" y="56" text-anchor="middle">handler</text><rect class="node" x="300" y="30" width="190" height="42" rx="10"/><text x="395" y="56" text-anchor="middle">CPU-heavy loop</text><rect class="node" x="530" y="30" width="130" height="42" rx="10"/><text x="595" y="56" text-anchor="middle">next task</text><path class="edge active" d="M 190 90 C 220 125, 250 125, 285 145"/><rect class="node active" x="285" y="122" width="165" height="42" rx="10"/><text x="367" y="148" text-anchor="middle">await remote I/O</text><path class="edge active" d="M 450 145 C 500 180, 500 205, 560 225"/><rect class="node" x="500" y="205" width="140" height="42" rx="10"/><text x="570" y="231" text-anchor="middle">network / worker</text></svg><div class="callout">Awaiting I/O lets other tasks run. A long synchronous CPU loop does not.</div></div>`;
}

export function renderVisual(kind) {
  if (kind === 'growth') return growthVisual();
  if (kind === 'memory') return memoryVisual();
  if (kind === 'amortized') return amortizedVisual();
  if (kind === 'recursion') return recursionVisual();
  if (kind === 'eventloop') return eventLoopVisual();
  return genericDiagram(kind);
}

function hydrateGeneric(root) {
  const edges = [...root.querySelectorAll('[data-edge]')];
  const nodes = [...root.querySelectorAll('[data-node] .node')];
  if (!edges.length) return;
  let i = 0;
  const tick = () => {
    edges.forEach((e, idx) => e.classList.toggle('active', idx === i));
    nodes.forEach((n, idx) => n.classList.toggle('active', idx === i || idx === i + 1));
    i = (i + 1) % edges.length;
  };
  tick();
  const timer = setInterval(tick, 1300);
  root.dataset.timer = String(timer);
}

function hydrateGrowth(root) {
  const range=root.querySelector('#growth-range'), chart=root.querySelector('#growth-chart'), legend=root.querySelector('#growth-legend'), copy=root.querySelector('#growth-copy'), label=root.querySelector('#growth-n');
  const curves=[['O(1)','var(--good)',n=>1],['O(log n)','#7dd3fc',n=>Math.log2(n)],['O(n)','#c4b5fd',n=>n],['O(n log n)','#fcd34d',n=>n*Math.log2(n)],['O(n²)','#fb923c',n=>n*n],['O(2ⁿ)','#fca5a5',n=>Math.pow(2,Math.min(n,20))]];
  const draw=()=>{const maxN=Number(range.value); label.textContent=maxN; const values=curves.map(c=>c[2](maxN)); const max=Math.max(...values); chart.innerHTML=curves.map(([name,color,fn])=>{const pts=[]; for(let x=1;x<=maxN;x++){const px=((x-1)/(maxN-1))*100; const py=100-(Math.log10(fn(x)+1)/Math.log10(max+1))*96; pts.push(`${px},${py}`)} return `<svg class="growth-line" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`}).join(''); legend.innerHTML=curves.map(([n,c])=>`<span><i style="background:${c}"></i>${n}</span>`).join(''); copy.innerHTML=`At <strong>n=${maxN}</strong>, n² is ${Math.round(maxN*maxN/maxN)}× the linear work. Exponential growth is clipped visually because it becomes enormous almost immediately.`};
  range.addEventListener('input',draw); draw();
}

function hydrateMemory(root) {
  const range=root.querySelector('#memory-range'), grid=root.querySelector('#memory-grid'), copy=root.querySelector('#memory-copy');
  const draw=()=>{const n=Number(range.value); let html=''; for(let i=0;i<n;i++) html+=`<div class="mem-cell input">in</div>`; for(let i=0;i<Math.ceil(n/2);i++) html+=`<div class="mem-cell aux">aux</div>`; for(let i=0;i<Math.ceil(Math.log2(n));i++) html+=`<div class="mem-cell stack">stk</div>`; grid.innerHTML=html; copy.innerHTML=`This illustration separates <strong>${n} input units</strong>, ${Math.ceil(n/2)} auxiliary units, and ${Math.ceil(Math.log2(n))} stack units. In an interview, state which category your O(·) claim refers to.`};
  range.addEventListener('input',draw); draw();
}

function hydrateAmortized(root) {
  const slots=root.querySelector('#array-slots'), copy=root.querySelector('#append-copy'); let size=0, cap=1, copied=0;
  const draw=(didResize=false)=>{slots.style.gridTemplateColumns=`repeat(${Math.min(cap,16)},1fr)`; slots.innerHTML=Array.from({length:cap},(_,i)=>`<div class="mem-cell ${i<size?'input':''}">${i<size?i:'·'}</div>`).join(''); copy.innerHTML=`size <strong>${size}</strong> · capacity <strong>${cap}</strong> · elements copied across resizes <strong>${copied}</strong>${didResize?' · <span style="color:var(--warn)">resize just copied the old array</span>':''}`};
  root.querySelector('#append-btn').onclick=()=>{let resized=false;if(size===cap){copied+=size;cap*=2;resized=true;}size++;draw(resized)}; root.querySelector('#append-reset').onclick=()=>{size=0;cap=1;copied=0;draw()}; draw();
}

function hydrateRecursion(root) {
  const svg=root.querySelector('#recursion-svg'), copy=root.querySelector('#recursion-copy');
  const draw=(mode)=>{ const naive=mode==='naive'; const nodes=naive?[[380,35,'f(5)'],[250,100,'f(4)'],[510,100,'f(3)'],[175,175,'f(3)'],[325,175,'f(2)'],[455,175,'f(2)'],[565,175,'f(1)'],[115,245,'f(2)'],[220,245,'f(1)'],[300,245,'f(1)'],[365,245,'f(0)']]:[[120,145,'f(1)'],[250,145,'f(2)'],[380,145,'f(3)'],[510,145,'f(4)'],[640,145,'f(5)']]; const edges=nodes.slice(1).map((n,i)=>{const parent=naive?nodes[Math.max(0,Math.floor((i)/2))]:nodes[i]; return `<path class="edge active" d="M ${parent[0]} ${parent[1]+22} L ${n[0]} ${n[1]-22}"/>`}).join(''); svg.innerHTML=edges+nodes.map(n=>`<g><rect class="node" x="${n[0]-40}" y="${n[1]-20}" width="80" height="40" rx="10"/><text x="${n[0]}" y="${n[1]+4}" text-anchor="middle">${n[2]}</text></g>`).join(''); copy.innerHTML=naive?'The same states appear repeatedly. The recursion tree grows exponentially.':'Memoization computes each state once: the graph collapses to roughly one node per distinct n.'; };
  root.querySelectorAll('[data-rec]').forEach(btn=>btn.onclick=()=>{root.querySelectorAll('[data-rec]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');draw(btn.dataset.rec)}); draw('naive');
}

export function hydrateVisual(root, kind) {
  if (!root) return;
  if (kind==='growth') return hydrateGrowth(root);
  if (kind==='memory') return hydrateMemory(root);
  if (kind==='amortized') return hydrateAmortized(root);
  if (kind==='recursion') return hydrateRecursion(root);
  if (kind==='eventloop') return;
  hydrateGeneric(root);
}
