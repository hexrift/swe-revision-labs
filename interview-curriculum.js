export const INTERVIEW_SOURCES = {
  mitAlgorithms:{label:'MIT OpenCourseWare · Introduction to Algorithms',url:'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/'},
  nodeEventLoop:{label:'Node.js · Event loop, timers and nextTick',url:'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick'},
  nodeStreams:{label:'Node.js · Backpressuring in Streams',url:'https://nodejs.org/en/learn/modules/backpressuring-in-streams'},
  nodeWorkers:{label:'Node.js · worker_threads',url:'https://nodejs.org/api/worker_threads.html'},
  tsHandbook:{label:'TypeScript Handbook',url:'https://www.typescriptlang.org/docs/handbook/intro.html'},
  pyThreading:{label:'Python 3.14 · threading',url:'https://docs.python.org/3/library/threading.html'},
  pyAsyncio:{label:'Python 3.14 · asyncio',url:'https://docs.python.org/3/library/asyncio.html'},
  pyDataModel:{label:'Python 3.14 · Data model',url:'https://docs.python.org/3/reference/datamodel.html'},
  pgIndexes:{label:'PostgreSQL 18 · Index types',url:'https://www.postgresql.org/docs/18/indexes-types.html'},
  pgExplain:{label:'PostgreSQL 18 · EXPLAIN',url:'https://www.postgresql.org/docs/18/sql-explain.html'},
  pgIsolation:{label:'PostgreSQL 18 · Transaction isolation',url:'https://www.postgresql.org/docs/18/transaction-iso.html'},
  pgMVCC:{label:'PostgreSQL 18 · Concurrency control / MVCC',url:'https://www.postgresql.org/docs/18/mvcc.html'},
  pgLocks:{label:'PostgreSQL 18 · Explicit locking',url:'https://www.postgresql.org/docs/18/explicit-locking.html'},
  pgPartition:{label:'PostgreSQL 18 · Table partitioning',url:'https://www.postgresql.org/docs/18/ddl-partitioning.html'},
  pgReplication:{label:'PostgreSQL 18 · Logical replication',url:'https://www.postgresql.org/docs/18/logical-replication.html'},
  raft:{label:'Raft consensus algorithm · references and paper',url:'https://raft.github.io/'},
  kafkaDesign:{label:'Apache Kafka · Design and delivery semantics',url:'https://kafka.apache.org/design/'},
  kafkaIntro:{label:'Apache Kafka · Introduction',url:'https://kafka.apache.org/intro/'},
  awsRetries:{label:'AWS Well-Architected · Control and limit retries',url:'https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_mitigate_interaction_failure_limit_retries.html'},
  awsTimeouts:{label:'AWS Well-Architected · Set client timeouts',url:'https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_mitigate_interaction_failure_client_timeouts.html'},
  ddia:{label:'Designing Data-Intensive Applications · Martin Kleppmann',url:'https://dataintensive.net/'},
  http:{label:'IETF RFC 9110 · HTTP Semantics',url:'https://www.rfc-editor.org/rfc/rfc9110'},
  http2:{label:'IETF RFC 9113 · HTTP/2',url:'https://www.rfc-editor.org/rfc/rfc9113'},
  http3:{label:'IETF RFC 9114 · HTTP/3',url:'https://www.rfc-editor.org/rfc/rfc9114'},
  tls:{label:'IETF RFC 8446 · TLS 1.3',url:'https://www.rfc-editor.org/rfc/rfc8446'},
  websocket:{label:'IETF RFC 6455 · WebSocket',url:'https://www.rfc-editor.org/rfc/rfc6455'},
  mdnSse:{label:'MDN · Server-sent events',url:'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events'},
  mdnWebTransport:{label:'MDN · WebTransport API',url:'https://developer.mozilla.org/en-US/docs/Web/API/WebTransport_API'},
  grpc:{label:'gRPC · Introduction',url:'https://grpc.io/docs/what-is-grpc/introduction/'},
  mdnCache:{label:'MDN · HTTP Cache-Control',url:'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control'},
  googleSre:{label:'Google SRE Book',url:'https://sre.google/sre-book/table-of-contents/'},
  googleSreWorkbook:{label:'Google SRE Workbook',url:'https://sre.google/workbook/table-of-contents/'},
  otel:{label:'OpenTelemetry · Concepts and signals',url:'https://opentelemetry.io/docs/concepts/'},
  fowlerCircuit:{label:'Martin Fowler · Circuit Breaker',url:'https://martinfowler.com/bliki/CircuitBreaker.html'},
  fowlerTestPyramid:{label:'Martin Fowler · The Practical Test Pyramid',url:'https://martinfowler.com/articles/practical-test-pyramid.html'},
  pact:{label:'Pact · Contract testing documentation',url:'https://docs.pact.io/'},
  hypothesis:{label:'Hypothesis · Property-based testing',url:'https://hypothesis.readthedocs.io/'},
  trunk:{label:'Trunk Based Development',url:'https://trunkbaseddevelopment.com/'},
  githubActions:{label:'GitHub Docs · Understanding GitHub Actions',url:'https://docs.github.com/en/actions/about-github-actions/understanding-github-actions'},
  k8sDeploy:{label:'Kubernetes · Deployments',url:'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/'}
};

const all = (bad,good)=>({javascript:{bad,good},typescript:{bad,good},python:{bad,good}});
const I = (id,category,title,source,type,bad,good,note,model,extra={})=>({
  id,category,title,source,languageAgnostic:true,viz:'interview',interviewModel:{type,...model},
  code:all(bad,good),note,...extra
});

export const INTERVIEW_CATEGORIES = [
  {id:'algorithms',title:'Algorithms & data structures',icon:'09',description:'Complexity, search, trees, graphs, heaps and dynamic programming.'},
  {id:'runtime',title:'Language & runtime internals',icon:'10',description:'JavaScript/Node, TypeScript and Python execution models.'},
  {id:'concurrency',title:'Concurrency & parallelism',icon:'11',description:'Races, locks, queues, async tasks, workers and backpressure.'},
  {id:'databases',title:'Databases & storage',icon:'12',description:'Indexes, query plans, MVCC, isolation, locking, partitioning and replication.'},
  {id:'distributed',title:'Distributed systems',icon:'13',description:'Consensus, consistency, partitions, delivery semantics and coordination.'},
  {id:'networking',title:'Networking & protocols',icon:'14',description:'DNS/TCP/TLS, HTTP versions, streaming protocols, gRPC and caching.'},
  {id:'reliability',title:'Reliability & observability',icon:'15',description:'SLOs, tail latency, retries, resilience, telemetry and incidents.'},
  {id:'testing',title:'Testing & delivery',icon:'16',description:'Test strategy, contracts, properties, CI/CD and safe rollout.'}
];

export const INTERVIEW_PATTERNS = [
  // ALGORITHMS
  I('asymptotic-bounds','algorithms','Big-O, Θ and Ω: say what you are bounding','mitAlgorithms','growth',
`"This is O(n)." // without saying what n is or whether the bound is tight`,
`n = number of records
time: Θ(n) for the full scan
auxiliary space: Θ(1)
worst case: all n records are inspected`,
'Complexity answers are only useful when the input variables, resource being measured and case are explicit.',
{normal:{labels:['O(1)','O(log n)','O(n)','O(n²)'],values:[1,7,100,10000]},edge:{labels:['O(1)','O(log n)','O(n)','O(n²)'],values:[1,17,100000,1e10]}},
{mentalModel:'Asymptotic notation describes growth, not wall-clock time. Θ is a tight bound; O is an upper bound; Ω is a lower bound.',
useWhen:['Comparing algorithms as inputs grow','Explaining scaling limits independently of machine speed'],
avoidWhen:['Treating Big-O as a benchmark or ignoring I/O/constant factors at realistic sizes'],
tradeoffs:['A better asymptotic class can lose on small inputs','Space and cache behavior may dominate before asymptotics do'],
tips:['Define every input variable','State time and auxiliary space separately','Name expected/worst/amortized case.']}),

  I('binary-search','algorithms','Binary search needs a monotonic search space','mitAlgorithms','search',
`while (lo < hi) {
  const mid = (lo + hi) >> 1;
  // change bounds without a proven invariant
}`,
`// invariant: answer is always inside [lo, hi]
while (lo <= hi) {
  const mid = lo + Math.floor((hi - lo) / 2);
  if (a[mid] < target) lo = mid + 1;
  else if (a[mid] > target) hi = mid - 1;
  else return mid;
}`,
'Binary search is about preserving an invariant while discarding half the candidate space.',
{normal:{steps:[64,32,16,8,4,2,1]},edge:{steps:[1000000,500000,250000,125000,62500,31250,15625]}},
{mentalModel:'At each comparison, a monotonic predicate lets you prove one half cannot contain the answer.',
useWhen:['Sorted collections','Answer-space searches with a monotonic predicate'],
avoidWhen:['The predicate is not monotonic','Maintaining sorted order costs more than the lookups justify'],
tradeoffs:['O(log n) lookup versus the cost of sorting/indexing','Off-by-one errors come from unclear invariants'],
tips:['Write the invariant before the loop','Decide inclusive/exclusive bounds once','Test empty, one-element and missing targets.']}),

  I('two-pointers-window','algorithms','Two pointers and sliding windows turn repeated scans into one pass','mitAlgorithms','window',
`for (let left=0; left<n; left++)
  for (let right=left; right<n; right++)
    check(a.slice(left,right+1));`,
`let left = 0;
for (let right=0; right<n; right++) {
  add(a[right]);
  while (!valid()) remove(a[left++]);
  record(left,right);
}`,
'When a window can be updated incrementally, each boundary often moves at most n times.',
{normal:{n:20,left:4,right:11},edge:{n:100000,left:42000,right:73000}},
{mentalModel:'The nested syntax can still be linear if each pointer moves only forward and never resets.',
useWhen:['Contiguous subarray/substring problems','Monotonic windows where adding/removing can update state incrementally'],
avoidWhen:['Window validity is not maintainable incrementally','You need arbitrary non-contiguous subsets'],
tradeoffs:['Extra bookkeeping buys fewer rescans','Correctness depends on the invariant for when the left pointer moves'],
tips:['Count pointer movements, not loop nesting','Write the window invariant','Know whether the window is fixed or variable length.']}),

  I('heap-priority','algorithms','Heap: keep the next best item without fully sorting everything','mitAlgorithms','heap',
`items.sort(compare);
const next = items.shift(); // re-sort/re-shift repeatedly`,
`const heap = new MinHeap(items);
while (heap.size) {
  const next = heap.pop(); // O(log n)
  process(next);
}`,
'A heap maintains enough order for efficient min/max extraction without maintaining a fully sorted sequence.',
{normal:{nodes:[1,3,5,7,9,11,13]},edge:{nodes:[1,2,3,4,100,101,102]}},
{mentalModel:'Only the heap-order property is maintained: parent priority dominates children; siblings are not globally sorted.',
useWhen:['Priority queues','Top-k / scheduling / shortest-path frontiers'],
avoidWhen:['You need ordered iteration of every element repeatedly','A small fixed-size array is simpler and faster'],
tradeoffs:['O(log n) update/extract versus O(1) peek','Partial order is cheaper than full sorting'],
tips:['State min-heap vs max-heap','For top-k, consider a heap of size k','Know decrease-key implications in graph algorithms.']}),

  I('graph-bfs-dfs','algorithms','BFS vs DFS: same graph, different frontier','mitAlgorithms','graph',
`walk graph recursively without a visited set`,
`visited = Set()
frontier = Queue() // BFS for levels / shortest unweighted path
// or Stack() / recursion for DFS structure`,
'BFS and DFS are both O(V+E) with adjacency lists, but their traversal order answers different questions.',
{normal:{nodes:7,edges:8,frontier:'queue'},edge:{nodes:12,edges:22,frontier:'stack'}},
{mentalModel:'Traversal is defined by the frontier discipline: FIFO gives BFS layers; LIFO gives DFS depth.',
useWhen:['BFS: shortest unweighted paths and levels','DFS: reachability, cycles, components and topological reasoning'],
avoidWhen:['Weighted shortest paths need Dijkstra/Bellman-Ford or another weighted algorithm'],
tradeoffs:['BFS can use large frontier memory','DFS recursion can overflow on deep graphs'],
tips:['Always track visited state in cyclic graphs','Name V and E','Know adjacency-list vs matrix space trade-offs.']}),

  I('dynamic-programming','algorithms','Dynamic programming = overlapping subproblems + reusable state','mitAlgorithms','dp',
`function best(i) {
  return Math.max(
    choiceA + best(nextA),
    choiceB + best(nextB)
  ); // recomputes same states
}`,
`memo = new Map();
function best(i) {
  if (memo.has(i)) return memo.get(i);
  const value = transition(i, best);
  memo.set(i, value);
  return value;
}`,
'DP is not “use a table”; it is identifying the state, recurrence, base cases and evaluation order.',
{normal:{states:12,transitions:2},edge:{states:1000,transitions:4}},
{mentalModel:'Many execution paths reach the same state. Cache each state once or compute states bottom-up.',
useWhen:['Optimal substructure + overlapping subproblems','Counting or optimization over a compact state'],
avoidWhen:['State space is as large as brute force','A greedy invariant proves a simpler choice is optimal'],
tradeoffs:['Time drops by spending memory on memo/table state','State design can dominate complexity'],
tips:['Define state in one sentence','Write recurrence and base cases before code','Estimate number of states × transitions per state.']}),

  // RUNTIME
  I('js-event-loop','runtime','JavaScript event loop: run-to-completion plus queues','nodeEventLoop','event-loop',
`while (Date.now() - start < 2000) {}
// every request/timer waits behind CPU work`,
`await moveCpuWorkToWorker();
await nonBlockingIO();
// event loop stays available for callbacks`,
'Async syntax does not make CPU work non-blocking; JavaScript callbacks still run to completion on an event-loop thread.',
{normal:{syncMs:20,queued:3},edge:{syncMs:2000,queued:80}},
{mentalModel:'The event loop selects callbacks; each callback owns the thread until it returns or awaits external work.',
useWhen:['Reasoning about Node/browser responsiveness and async ordering'],
avoidWhen:['Assuming Promise/async automatically parallelizes CPU-heavy code'],
tradeoffs:['Single-threaded execution simplifies shared-state reasoning','Long callbacks create latency for unrelated work'],
tips:['Keep callbacks bounded','Move CPU-heavy work to workers/processes','Understand microtasks vs task phases where ordering matters.']}),

  I('node-streams','runtime','Streams and backpressure keep memory bounded','nodeStreams','buffer',
`const all = await readEntireFile();
await send(all);`,
`readable.pipe(transform).pipe(writable);
// writer pressure propagates upstream`,
'Streaming processes chunks incrementally; backpressure prevents a fast producer from unbounded buffering behind a slow consumer.',
{normal:{producer:80,consumer:80,buffer:4},edge:{producer:500,consumer:70,buffer:64}},
{mentalModel:'A stream is a bounded handoff between producers and consumers; backpressure is the feedback signal.',
useWhen:['Large files/data sets','Pipelines where producer and consumer speeds differ'],
avoidWhen:['Tiny payloads where streaming complexity has no value'],
tradeoffs:['Lower peak memory and earlier first byte','More lifecycle/error/backpressure handling'],
tips:['Handle stream errors and cancellation','Respect high-water marks','Do not collect chunks back into one huge buffer accidentally.']}),

  I('python-gil','runtime','Python threads, the GIL and free-threaded builds','pyThreading','threads',
`# CPU-bound pure Python on default CPython
start_many_threads(cpu_heavy)`,
`# default CPython:
threads_for_io()
processes_for_cpu()
# or evaluate a free-threaded build where appropriate`,
'On standard CPython builds, one thread at a time executes Python bytecode; threads still help I/O, and free-threaded builds exist but are not the default.',
{normal:{threads:8,cpu:false},edge:{threads:8,cpu:true}},
{mentalModel:'Concurrency and parallelism depend on the runtime. The GIL serializes Python bytecode in standard CPython while I/O can release it.',
useWhen:['Threads for blocking I/O','Processes/native code/free-threaded builds when true CPU parallelism is needed'],
avoidWhen:['Expecting more Python threads to make CPU-bound bytecode scale linearly'],
tradeoffs:['Threads share memory cheaply','Processes isolate memory but add IPC/serialization'],
tips:['Name the Python implementation/build','Measure native-library behavior','Do not repeat the outdated claim “Python can never use threads in parallel” without qualification.']}),

  I('asyncio','runtime','asyncio is cooperative concurrency','pyAsyncio','event-loop',
`async def handler():
    cpu_heavy_loop()  # no await; blocks every task`,
`async def handler():
    data = await io_call()
    result = await asyncio.to_thread(blocking_work, data)
    return result`,
'asyncio tasks make progress when control returns to the event loop; blocking work stalls peer tasks.',
{normal:{tasks:12,blockingMs:5},edge:{tasks:500,blockingMs:800}},
{mentalModel:'Async tasks share an event loop cooperatively; awaiting I/O yields, ordinary CPU code does not.',
useWhen:['Many concurrent I/O operations','Structured async workflows'],
avoidWhen:['CPU-bound work that should be parallelized elsewhere'],
tradeoffs:['Low per-task overhead','Requires async-aware libraries and explicit cancellation/error handling'],
tips:['Propagate cancellation','Prefer structured task groups where possible','Bound concurrency rather than spawning unbounded tasks.']}),

  I('ts-narrowing','runtime','TypeScript types disappear at runtime','tsHandbook','types',
`function handle(x: UserPayload) {
  return x.user.name; // caller/network may not actually match type
}`,
`function handle(x: unknown) {
  const payload = UserSchema.parse(x);
  return payload.user.name;
}`,
'TypeScript checks source code, not network truth. Runtime boundaries still require parsing and validation.',
{normal:{input:'valid JSON',narrowed:true},edge:{input:'malformed payload',narrowed:false}},
{mentalModel:'Static types constrain programs you write; runtime validation constrains values you receive.',
useWhen:['Always at untrusted runtime boundaries','Use narrowing/discriminated unions inside typed code'],
avoidWhen:['Treating a type assertion as data validation'],
tradeoffs:['Validation adds runtime work','It converts latent type assumptions into explicit boundary failures'],
tips:['Prefer unknown to any at boundaries','Use discriminated unions for state machines','Avoid unsound casts that silence the compiler.']}),

  I('python-generators','runtime','Generators trade random access for lazy memory use','pyDataModel','buffer',
`rows = [transform(r) for r in read_millions()]
return rows`,
`def rows():
    for row in read_millions():
        yield transform(row)`,
'Generators produce values on demand and preserve execution state between yields, avoiding full materialization.',
{normal:{items:1000,materialized:1000},edge:{items:10000000,materialized:10000000}},
{mentalModel:'A generator is a suspended computation, not a prebuilt collection.',
useWhen:['Pipelines and large sequences','Consumers can process incrementally'],
avoidWhen:['You need repeated random access or length without consuming the sequence'],
tradeoffs:['Low peak memory','Single-pass semantics and deferred errors'],
tips:['Know when an iterator is exhausted','Do not accidentally wrap it in list()/Array.from() too early','Be explicit about ownership of open files/resources.']}),

  // CONCURRENCY
  I('race-condition','concurrency','Race condition: correctness depends on timing','pyThreading','interleaving',
`if (balance >= amount)
  balance = balance - amount;
// two workers can both pass the check`,
`lock(account);
try {
  if (balance < amount) reject();
  balance -= amount;
} finally { unlock(account); }`,
'The bug is not “threads are bad”; the read-check-write invariant is not atomic across competing actors.',
{normal:{actors:1,balance:100,amount:70},edge:{actors:2,balance:100,amount:70}},
{mentalModel:'List the possible interleavings around shared mutable state and identify the invariant that must be atomic.',
useWhen:['Any shared mutable state across threads/tasks/processes'],
avoidWhen:['Adding a global lock before considering ownership, immutability or database atomic operations'],
tradeoffs:['Synchronization preserves invariants','Too-broad locks reduce concurrency and can deadlock'],
tips:['Minimize critical sections','Prefer single ownership/message passing where it fits','Test with contention, not only sequential unit tests.']}),

  I('deadlock','concurrency','Deadlock: incompatible lock ordering','pyThreading','locks',
`taskA: lock(A); lock(B)
taskB: lock(B); lock(A)`,
`// global lock ordering
taskA: lock(A); lock(B)
taskB: lock(A); lock(B)`,
'Circular wait is one of the classic ingredients of deadlock; consistent acquisition order is a common prevention technique.',
{normal:{a:'A→B',b:'A→B'},edge:{a:'A→B',b:'B→A'}},
{mentalModel:'Draw who owns each resource and who is waiting. A cycle in the wait graph is the danger.',
useWhen:['Reasoning about multiple locks/resources'],
avoidWhen:['Using timeouts as the only “fix” for a deterministic lock-order problem'],
tradeoffs:['Fine-grained locks improve parallelism','More locks increase ordering complexity'],
tips:['Define lock hierarchy','Avoid calling unknown code while holding locks','Capture thread dumps/wait graphs in production tooling.']}),

  I('semaphore','concurrency','Semaphore: concurrency is a budget','pyAsyncio','capacity',
`await Promise.all(tenThousand.map(callDependency));`,
`const limit = new Semaphore(32);
await Promise.all(items.map(x =>
  limit.run(() => callDependency(x))
));`,
'A semaphore limits simultaneous work without forcing all work to be serial.',
{normal:{requests:100,limit:32},edge:{requests:10000,limit:32}},
{mentalModel:'Only N actors hold permits; the rest wait. Capacity protects memory, sockets and downstream services.',
useWhen:['Bounded parallel I/O','Protecting a constrained dependency'],
avoidWhen:['A queue/worker architecture is a better durable boundary'],
tradeoffs:['Lower overload risk','Potential queueing latency under saturation'],
tips:['Measure queue wait separately from service time','Choose limits from downstream capacity','Fail or shed when waiting itself becomes harmful.']}),

  I('worker-pool','concurrency','Worker pools amortize expensive execution resources','nodeWorkers','pool',
`for (const job of jobs)
  new Worker('./cpu.js', { workerData: job });`,
`const pool = new WorkerPool(cpuCount);
for (const job of jobs)
  pool.submit(job);`,
'Creating a worker/process per tiny task can cost more than the task. Pools reuse workers and bound parallelism.',
{normal:{jobs:20,workers:4},edge:{jobs:5000,workers:8}},
{mentalModel:'A fixed set of execution resources pulls jobs from a queue.',
useWhen:['CPU work with many jobs','Worker startup is non-trivial'],
avoidWhen:['Jobs are rare/large enough that a pool adds no value'],
tradeoffs:['Amortized startup cost','Queueing and pool sizing complexity'],
tips:['Separate queue time from compute time','Avoid sharing mutable state across workers','Size by CPU/memory and task characteristics.']}),

  I('producer-consumer','concurrency','Producer/consumer: queue depth is the hidden state','nodeStreams','queue',
`producer() -> unbounded array.push(work)
consumer() -> eventually catches up`,
`producer() -> bounded queue
queue full -> wait / reject / shed
consumer() -> drain at sustainable rate`,
'If arrival rate exceeds service rate for long enough, an unbounded queue is just delayed failure.',
{normal:{arrival:80,service:100,depth:5},edge:{arrival:180,service:100,depth:500}},
{mentalModel:'Queue depth integrates the difference between arrival rate and service rate over time.',
useWhen:['Decoupling producers and consumers','Absorbing short bursts'],
avoidWhen:['Using a queue to hide permanently insufficient capacity'],
tradeoffs:['Burst smoothing','Added latency and stale work when backlog grows'],
tips:['Alert on queue age, not only count','Set maximum depth/age','Scale consumers or shed load before backlog becomes unrecoverable.']}),

  I('atomic-vs-lock','concurrency','Atomic operation vs lock: protect the invariant, not the line','pyThreading','interleaving',
`count++; // may not be atomic in your runtime/context
if (stock > 0) stock--; // compound invariant`,
`atomicIncrement(count);
// for stock check+decrement, use one atomic DB/runtime primitive
// or a lock/transaction around the compound invariant`,
'Atomic primitives solve specific state transitions; they do not automatically make multi-step invariants atomic.',
{normal:{operations:1,sharedFields:1},edge:{operations:3,sharedFields:2}},
{mentalModel:'Ask what must appear indivisible to competing actors. That unit may be larger than one machine instruction.',
useWhen:['Counters/flags with supported atomic primitives','Locks/transactions for compound invariants'],
avoidWhen:['Assuming a thread-safe collection makes your multi-step workflow thread-safe'],
tradeoffs:['Atomics can reduce lock contention','Complex lock-free logic is difficult to prove and maintain'],
tips:['Prefer the simplest synchronization that meets throughput needs','Document memory/order assumptions','Use database atomic updates for database-owned invariants.']}),

  // DATABASES
  I('btree-index','databases','B-tree index: ordered lookup structure, not free speed','pgIndexes','tree-index',
`SELECT * FROM events WHERE created_at >= ?;
// no useful index; scan many rows`,
`CREATE INDEX ON events(created_at);
SELECT ... WHERE created_at >= ?;`,
'B-tree indexes support equality and ordered/range access, but every index consumes storage and write maintenance.',
{normal:{rows:100000,matched:100},edge:{rows:100000000,matched:40000000}},
{mentalModel:'The index narrows candidate pages through a balanced ordered tree, then points to table rows.',
useWhen:['Selective equality/range predicates','ORDER BY + LIMIT patterns that match index order'],
avoidWhen:['Very low-selectivity queries that read much of the table','Columns whose write-maintenance cost outweighs read benefit'],
tradeoffs:['Faster selective reads','More storage and slower writes/index maintenance'],
tips:['Index for real query shapes','Column order matters in multi-column indexes','Verify with EXPLAIN/ANALYZE rather than assuming use.']}),

  I('query-plan','databases','Read the query plan, not just the SQL','pgExplain','query-plan',
`"The query looks simple, so it should be fast."`,
`EXPLAIN (ANALYZE, BUFFERS)
SELECT ...
// inspect scan type, join strategy,
// row estimates and actual rows`,
'The planner chooses scans, joins and ordering strategies from statistics and cost estimates; the SQL text alone does not reveal execution.',
{normal:{estimated:1000,actual:1100},edge:{estimated:1000,actual:200000}},
{mentalModel:'A plan is a tree of physical operators. Bad cardinality estimates can push the planner toward bad join/scan choices.',
useWhen:['Any slow or surprising database query'],
avoidWhen:['Optimizing from intuition without runtime evidence'],
tradeoffs:['ANALYZE gives truth but actually runs the query','Planner costs are estimates, not milliseconds'],
tips:['Compare estimated vs actual rows','Look for large loops × rows','Inspect buffers/I/O when available.']}),

  I('mvcc','databases','MVCC: readers see versions, not one mutable row','pgMVCC','versions',
`reader blocks every writer
writer blocks every reader`,
`transaction snapshot -> visible row version
writer -> new version
cleanup/vacuum -> old versions later reclaimed`,
'MVCC lets reads and writes coexist by keeping row versions and visibility rules rather than one universally locked current copy.',
{normal:{versions:2,readers:4,writers:1},edge:{versions:50,readers:20,writers:20}},
{mentalModel:'A transaction reads a visibility snapshot; updates create new versions rather than overwriting every reader’s view in place.',
useWhen:['Understanding PostgreSQL concurrency and vacuum behavior'],
avoidWhen:['Assuming MVCC means “no locks” or “no write conflicts”'],
tradeoffs:['High read/write concurrency','Version churn, cleanup and storage overhead'],
tips:['Know your isolation level','Watch long-running transactions that retain old versions','Understand row locks for conflicting writes.']}),

  I('isolation-levels','databases','Isolation levels choose which concurrency anomalies are allowed','pgIsolation','transactions',
`// assume two concurrent transactions
// will behave as if one ran fully first`,
`choose isolation deliberately:
Read Committed
Repeatable Read
Serializable
and handle retries where required`,
'Isolation is a correctness contract, not a database performance toggle.',
{normal:{transactions:2,conflict:false},edge:{transactions:2,conflict:true}},
{mentalModel:'Concurrent transactions can observe different snapshots. Stronger isolation rejects or hides more anomalies.',
useWhen:['Any multi-step business invariant across concurrent transactions'],
avoidWhen:['Assuming default isolation matches every invariant'],
tradeoffs:['Stronger isolation simplifies reasoning','May add blocking/serialization failures/retries'],
tips:['State the anomaly you are preventing','Keep transactions short','Design retry-safe transaction boundaries.']}),

  I('db-locks-deadlocks','databases','Database locks: deadlocks are resolved by aborting someone','pgLocks','locks',
`T1: UPDATE accounts A; then B
T2: UPDATE accounts B; then A`,
`// consistent ordering
UPDATE accounts in ascending id order;
// keep transaction small`,
'Databases detect lock cycles and abort a transaction; application code must tolerate and retry appropriate failures.',
{normal:{t1:'A→B',t2:'A→B'},edge:{t1:'A→B',t2:'B→A'}},
{mentalModel:'Rows/resources form a wait graph just like in-process locks.',
useWhen:['Write-heavy transactional systems','Diagnosing blocked queries/deadlocks'],
avoidWhen:['Keeping transactions open across user/network think time'],
tradeoffs:['Locks preserve write invariants','Contention turns into queueing or deadlocks'],
tips:['Acquire resources in consistent order','Index predicates so updates lock only intended rows','Log deadlock details and retry safely.']}),

  I('partitioning','databases','Partitioning helps pruning/operations; it is not automatic speed','pgPartition','partition',
`one giant table
or
partition every table "for performance"`,
`partition by a key aligned with access/lifecycle:
events_2026_09
events_2026_10
planner prunes irrelevant partitions`,
'Partitioning changes physical/administrative layout and can let the planner skip irrelevant partitions when predicates align.',
{normal:{partitions:12,touched:1},edge:{partitions:200,touched:140}},
{mentalModel:'Partitioning only helps a query when its predicates let the system exclude partitions or operations benefit from lifecycle boundaries.',
useWhen:['Very large tables','Time/lifecycle management','Queries strongly aligned with partition key'],
avoidWhen:['Small tables','Queries frequently touch most partitions'],
tradeoffs:['Pruning and easier archival/maintenance','More metadata/planning and operational complexity'],
tips:['Choose key from access pattern','Test partition pruning','Avoid huge numbers of tiny partitions.']}),

  // DISTRIBUTED
  I('consensus-leader','distributed','Consensus: agree on one ordered history despite failures','raft','consensus',
`each node accepts writes independently
then "merge later" for data that requires one authoritative order`,
`leader proposes log entry
replicas acknowledge
quorum commits
followers apply committed order`,
'Consensus algorithms such as Raft establish a replicated log/order under a defined failure model; they do not make partitions disappear.',
{normal:{nodes:5,available:5,quorum:3},edge:{nodes:5,available:2,quorum:3}},
{mentalModel:'A majority quorum lets the system preserve one committed history while tolerating a minority of unavailable nodes.',
useWhen:['Metadata/control planes','Strongly ordered replicated state'],
avoidWhen:['Data naturally tolerates conflict/eventual convergence and consensus cost is unnecessary'],
tradeoffs:['Strong ordering and failover','Coordination latency and loss of availability without quorum'],
tips:['Know the failure model','Separate leader election from commit semantics','Do not invent consensus casually in application code.']}),

  I('delivery-semantics','distributed','At-most-once, at-least-once, exactly-once: define the scope','kafkaDesign','delivery',
`consume message
perform side effect
crash before ack
// assume broker can magically know side effect status`,
`consume
perform idempotent/transactional effect
record progress
ack according to delivery contract`,
'“Exactly once” only means something relative to a defined boundary; external side effects can still require idempotency or transactions.',
{normal:{deliveries:1,sideEffects:1},edge:{deliveries:2,sideEffects:1}},
{mentalModel:'Publishing durability, broker redelivery and consumer side effects are separate guarantees.',
useWhen:['Designing message consumers and retry behavior'],
avoidWhen:['Claiming exactly-once end-to-end without stating storage/side-effect boundaries'],
tradeoffs:['At-least-once is robust but permits duplicates','At-most-once avoids duplicates by allowing loss','Transactional exactly-once mechanisms add constraints/coordination'],
tips:['Make consumers idempotent where possible','Use stable operation keys','Document where offsets/progress commit relative to side effects.']}),

  I('eventual-consistency','distributed','Eventual consistency: convergence after updates stop','ddia','replication',
`write primary
immediately read replica
expect newest value every time`,
`write primary
replica catches up asynchronously
read policy chooses:
- stale-tolerant replica
- read-your-write path
- strong source`,
'Asynchronous replication improves latency/availability but creates periods where replicas legitimately disagree.',
{normal:{lagMs:20,writeVersion:8,replicaVersion:8},edge:{lagMs:5000,writeVersion:9,replicaVersion:8}},
{mentalModel:'Different replicas can expose different prefixes of history until replication catches up.',
useWhen:['Read scaling and geographic distribution where some staleness is acceptable'],
avoidWhen:['Operations require latest-write visibility or one authoritative order'],
tradeoffs:['Lower write latency / better locality','Stale reads and failover data-loss windows depending on replication semantics'],
tips:['Define acceptable staleness','Consider read-your-writes/session guarantees','Monitor replication lag as a product correctness signal.']}),

  I('network-partition','distributed','Network partition: decide what the system does when nodes cannot talk','ddia','partition-network',
`if peer is silent, assume it is dead
and accept conflicting writes everywhere`,
`define partition policy:
- require quorum for strong write
- or accept local writes and reconcile
based on business semantics`,
'Partitions make failure detection ambiguous: a remote node may be dead, slow or merely unreachable.',
{normal:{regions:2,link:true},edge:{regions:2,link:false}},
{mentalModel:'A timeout cannot prove death. Your design must choose which operations continue and which guarantees are relaxed.',
useWhen:['Any multi-node/region system'],
avoidWhen:['Ignoring partition behavior because “the network is reliable”'],
tradeoffs:['Continuing writes can preserve availability but create conflicts','Requiring quorum preserves stronger consistency but rejects work without connectivity'],
tips:['Write partition behavior into requirements','Test split-brain/failover scenarios','Prefer fencing/leases where stale leaders are dangerous.']}),

  I('partition-ordering','distributed','Partitioned logs trade global order for parallelism','kafkaIntro','partitions',
`topic with 20 partitions
assume every event is globally ordered`,
`choose partition key = orderId
events for one order stay ordered
different orders process in parallel`,
'Kafka-style partitioning gives order within a partition, not a free global total order across partitions.',
{normal:{partitions:6,keyed:true},edge:{partitions:6,keyed:false}},
{mentalModel:'The partition key defines both the unit of ordering and the unit of parallel consumption.',
useWhen:['High-throughput event streams','Entity-local ordering is enough'],
avoidWhen:['You genuinely require one total global order at high throughput'],
tradeoffs:['More partitions increase parallelism','Hot keys create skew','Ordering is scoped to the partition'],
tips:['Choose key from ordering semantics','Ensure enough partitions for expected consumer parallelism','Watch per-partition lag, not only topic-wide totals.']}),

  I('retry-storm','distributed','Retries can amplify failure into an outage','awsRetries','retry',
`service A retries B 3x
B retries C 3x
C retries D 3x
// one request can multiply downstream work`,
`one retry policy at the right layer
bounded attempts
exponential backoff + jitter
shared deadline / retry budget`,
'Retries are load. During partial failure, uncoordinated retries can multiply demand exactly when capacity is reduced.',
{normal:{layers:1,retries:2,multiplier:3},edge:{layers:4,retries:3,multiplier:81}},
{mentalModel:'Retry multiplication is exponential across layers; backoff/jitter spread retries but do not create capacity.',
useWhen:['Transient errors where another attempt is likely to succeed'],
avoidWhen:['Permanent validation errors','Overloaded dependencies without room to recover'],
tradeoffs:['Retries improve success probability','Increase latency and load'],
tips:['Retry at one layer where possible','Use jitter and maximum attempts','Respect an end-to-end deadline.']}),

  // NETWORKING
  I('tcp-tls-http','networking','TCP/TLS/HTTP: separate transport, security and application semantics','tls','protocol-stack',
`"HTTPS is just encrypted HTTP"
without understanding connection setup or trust`,
`DNS -> IP
TCP/QUIC -> transport
TLS -> authenticated encryption
HTTP -> request/response semantics`,
'Layering matters because failures and performance costs occur at different layers.',
{normal:{steps:['DNS','TCP','TLS','HTTP']},edge:{steps:['DNS retry','TCP connect','TLS handshake fail','no HTTP']}},
{mentalModel:'HTTP semantics ride on a transport; TLS authenticates/encrypts; DNS locates endpoints. Diagnose the layer that failed.',
useWhen:['Debugging latency/connectivity','Designing timeouts and connection reuse'],
avoidWhen:['Treating all network failures as HTTP status codes'],
tradeoffs:['More handshakes improve security/session establishment but add latency','Connection reuse amortizes setup cost'],
tips:['Measure DNS/connect/TLS/server timings separately','Use keep-alive/connection pools','Know where TLS terminates in your architecture.']}),

  I('http2-multiplex','networking','HTTP/2 multiplexes streams over one connection','http2','multiplex',
`many HTTP/1.1 requests
need several connections to avoid serial request limits`,
`HTTP/2 connection
stream 1 ─┐
stream 3 ─┼─ multiplexed frames
stream 5 ─┘`,
'HTTP/2 multiplexes application streams over one TCP connection and compresses headers, but TCP packet loss can still affect the shared connection.',
{normal:{streams:6,loss:false},edge:{streams:40,loss:true}},
{mentalModel:'Independent HTTP streams are framed together on one reliable TCP byte stream.',
useWhen:['Modern HTTP clients/servers where many concurrent requests share an origin'],
avoidWhen:['Assuming multiplexing removes all head-of-line effects at the transport layer'],
tradeoffs:['Fewer connections and concurrent streams','Shared TCP loss/congestion state'],
tips:['Let mature servers/clients negotiate protocol','Observe connection reuse','Do not manually shard domains for HTTP/1-era tricks without measurement.']}),

  I('http3-quic','networking','HTTP/3 uses QUIC streams over UDP','http3','multiplex',
`assume HTTP/3 is "HTTP/2 but faster" in every network`,
`QUIC:
TLS integrated
independent transport streams
connection migration
HTTP/3 semantics above`,
'HTTP/3 moves HTTP onto QUIC, avoiding TCP-level head-of-line blocking between streams and integrating TLS 1.3.',
{normal:{streams:6,loss:false},edge:{streams:6,loss:true}},
{mentalModel:'Packet loss affecting one QUIC stream does not necessarily stall unrelated streams the way TCP connection loss can.',
useWhen:['Modern web delivery where client/server/network support HTTP/3'],
avoidWhen:['Assuming support/benefit is universal across every network and intermediary'],
tradeoffs:['Improved multiplexing and connection setup characteristics','UDP/QUIC operational visibility and network support differ'],
tips:['Measure real clients/networks','Keep HTTP semantics independent of transport version','Understand fallback to earlier HTTP versions.']}),

  I('realtime-options','networking','SSE vs WebSocket vs WebTransport','mdnWebTransport','realtime',
`choose WebSocket for every live feature`,
`SSE: server -> browser event stream
WebSocket: bidirectional ordered messages
WebTransport: HTTP/3 streams + datagrams`,
'Real-time transports have different directionality, reliability and deployment characteristics.',
{normal:{need:'server push',choice:'SSE'},edge:{need:'bidirectional + unreliable datagrams',choice:'WebTransport'}},
{mentalModel:'Choose the minimum transport semantics the product needs.',
useWhen:['SSE for simple server push','WebSocket for mature bidirectional messaging','WebTransport when HTTP/3 stream/datagram semantics are genuinely useful and support is acceptable'],
avoidWhen:['Using a persistent bidirectional protocol when polling/SSE is simpler'],
tradeoffs:['SSE integrates naturally with HTTP but is one-way','WebSocket is widely supported but backpressure is your problem','WebTransport is newer and support must be checked'],
tips:['Design reconnection/resume','Authenticate long-lived connections','Bound per-connection queues.']}),

  I('grpc','networking','gRPC: strongly defined RPC contracts over HTTP/2','grpc','rpc',
`POST /doThing
loosely documented JSON
different clients disagree on fields`,
`service Inventory {
  rpc Reserve(ReserveRequest) returns (ReserveReply);
}
// generated clients/servers from protobuf schema`,
'gRPC uses service definitions and generated stubs to make remote method contracts explicit; it is still a network call with deadlines and partial failure.',
{normal:{calls:1,deadlineMs:500},edge:{calls:8,deadlineMs:50}},
{mentalModel:'Generated local-looking stubs hide serialization and transport, not network failure.',
useWhen:['Service-to-service RPC with typed contracts','Streaming RPCs and polyglot services'],
avoidWhen:['Public browser-facing APIs where plain HTTP/JSON ergonomics matter more','Teams cannot manage schema compatibility'],
tradeoffs:['Strong contracts and efficient binary messages','Less human-readable payloads and gateway/browser considerations'],
tips:['Always set deadlines','Treat status/retry semantics explicitly','Version protobuf fields compatibly.']}),

  I('http-caching','networking','HTTP caching is a correctness protocol, not just a speed switch','mdnCache','cache',
`Cache-Control: max-age=86400
for user-specific mutable data
without validators/invalidation thinking`,
`Cache-Control: private, max-age=60
ETag: "v42"
client revalidates with If-None-Match`,
'HTTP caches obey directives and validators; freshness and privacy semantics matter as much as hit rate.',
{normal:{freshSeconds:60,age:20},edge:{freshSeconds:60,age:120}},
{mentalModel:'A cache entry has ownership (private/shared), freshness lifetime and optional validator for revalidation.',
useWhen:['Static/versioned assets','Responses where freshness rules are explicit'],
avoidWhen:['Sensitive per-user responses accidentally marked public','Data whose invalidation semantics are unknown'],
tradeoffs:['Lower latency/origin load','Staleness and invalidation complexity'],
tips:['Use immutable versioned asset URLs where possible','Understand private/public/no-store','Pair freshness with validators for revalidation.']}),

  // RELIABILITY
  I('sli-slo-sla','reliability','SLI, SLO, SLA: measurement, target, agreement','googleSre','slo',
`"We need 99.99% uptime"
without defining what counts as success or over what window`,
`SLI = successful eligible requests / eligible requests
SLO = 99.95% over 30 days
SLA = external contractual commitment (if any)`,
'SLOs are useful only when the measured user-visible behavior and window are precise.',
{normal:{target:99.9,actual:99.95},edge:{target:99.9,actual:99.5}},
{mentalModel:'Measure a service behavior (SLI), set an objective (SLO), then use the gap/error budget to drive engineering decisions.',
useWhen:['Reliability targets and prioritization'],
avoidWhen:['Using “five nines” as a slogan disconnected from user journeys'],
tradeoffs:['Higher reliability targets reduce allowed change/failure budget','Overly strict SLOs can waste engineering effort'],
tips:['Use user-centric SLIs','Exclude only traffic you can justify excluding','Choose windows aligned with product impact.']}),

  I('tail-latency','reliability','Tail latency: averages hide the users having a bad time','googleSre','latency',
`average latency = 120 ms
"performance is fine"`,
`p50 = 80 ms
p95 = 240 ms
p99 = 1.8 s
investigate the tail`,
'Percentiles expose the distribution. Fan-out systems can amplify tail latency because a request waits for the slowest dependency.',
{normal:{p50:80,p95:180,p99:350},edge:{p50:80,p95:600,p99:3000}},
{mentalModel:'Latency is a distribution; averages compress away the slow tail.',
useWhen:['User-facing latency SLOs','Capacity and dependency analysis'],
avoidWhen:['Reporting a single average as the complete performance story'],
tradeoffs:['Optimizing p99 can cost capacity/money','Tail work often reveals contention, GC, retries or hot partitions'],
tips:['Graph percentiles over time','Separate queue time from service time','Trace slow requests.']}),

  I('timeouts-deadlines','reliability','Timeouts need an end-to-end deadline','awsTimeouts','deadline',
`service A timeout 5s
calls B timeout 5s
B calls C timeout 5s
// nested waits exceed user budget`,
`request deadline = now + 1500ms
each hop receives remaining budget
stop work when deadline expires`,
'A local timeout protects one call; a deadline protects the whole user operation.',
{normal:{budget:1500,spent:600},edge:{budget:1500,spent:1450}},
{mentalModel:'Every hop spends from one finite latency budget.',
useWhen:['Distributed request chains','Cancelable long-running work'],
avoidWhen:['Independent background work that should not share the request deadline'],
tradeoffs:['Short deadlines fail fast','Too-short deadlines create false failures/retries'],
tips:['Propagate remaining deadline','Cancel downstream work after caller gives up','Measure timeout rate by dependency.']}),

  I('circuit-breaker','reliability','Circuit breaker stops hammering a known-bad dependency','fowlerCircuit','breaker',
`for every request:
  call failing dependency
  wait timeout
  consume thread/socket
  fail`,
`closed -> failures exceed threshold
open -> fail fast
half-open -> probe recovery
closed -> resume`,
'A circuit breaker is a state machine around repeated remote failure, not a replacement for retries or health checks.',
{normal:{state:'closed',failures:1},edge:{state:'open',failures:20}},
{mentalModel:'After enough evidence of failure, stop spending resources on calls unlikely to succeed; periodically probe recovery.',
useWhen:['Remote dependency failures are expensive and repeated'],
avoidWhen:['Failures are per-request/business errors rather than dependency health'],
tradeoffs:['Protects resources and reduces cascades','Can reject calls during partial recovery if thresholds are poor'],
tips:['Instrument state transitions','Combine with timeout/retry budgets','Define fallback/degradation separately.']}),

  I('observability-signals','reliability','Traces, metrics and logs answer different questions','otel','telemetry',
`log("request failed")
// no request id, no latency distribution,
// no cross-service context`,
`metric: request.duration histogram
trace: spans across services
log: structured failure with trace_id
all correlated by context`,
'OpenTelemetry models traces, metrics and logs as distinct but correlatable signals.',
{normal:{signals:3,correlated:true},edge:{signals:3,correlated:false}},
{mentalModel:'Metrics tell you how often/how much; traces tell you where time/work flowed; logs record detailed events.',
useWhen:['Production systems where failures cross process/service boundaries'],
avoidWhen:['Collecting high-cardinality telemetry without cost/privacy controls'],
tradeoffs:['More telemetry improves diagnosis','Storage, ingestion and cardinality costs can explode'],
tips:['Propagate trace context','Use structured logs','Choose metrics labels with bounded cardinality.']}),

  I('load-shedding','reliability','Load shedding protects useful work under overload','googleSreWorkbook','capacity',
`accept every request
queues grow
latency explodes
everything times out`,
`capacity threshold reached
reject/deprioritize low-value work early
preserve capacity for admitted requests`,
'Under overload, doing less work can increase successful useful throughput.',
{normal:{capacity:100,arrival:80,accepted:80},edge:{capacity:100,arrival:180,accepted:100}},
{mentalModel:'Once saturated, queueing delay can consume all latency budget. Admission control keeps the system inside a useful operating region.',
useWhen:['Systems with bounded capacity and burst traffic'],
avoidWhen:['Shedding critical requests without explicit prioritization/business policy'],
tradeoffs:['Some requests fail early','More admitted requests complete successfully'],
tips:['Shed before queues become enormous','Return retry guidance where appropriate','Prioritize classes of work explicitly.']}),

  // TESTING & DELIVERY
  I('test-levels','testing','Unit, integration and end-to-end tests cover different risks','fowlerTestPyramid','tests',
`every behavior only tested through browser E2E
slow, brittle feedback`,
`unit: pure rules
integration: database/queue boundaries
E2E: a small set of critical user journeys`,
'The useful question is not “what percentage should be unit tests?” but which risk needs which level of realism.',
{normal:{unit:70,integration:25,e2e:5},edge:{unit:10,integration:20,e2e:70}},
{mentalModel:'Move a test down when it can catch the same bug with less cost; move it up when the lower level cannot represent the integration risk.',
useWhen:['Designing a maintainable automated test portfolio'],
avoidWhen:['Treating the pyramid as a fixed quota'],
tradeoffs:['Lower-level tests are faster and more isolated','Higher-level tests cover more real integration but are slower/brittler'],
tips:['Keep E2E focused on critical journeys','Use real dependencies where behavior matters','Make failures diagnostic.']}),

  I('contract-testing','testing','Contract tests protect service boundaries without full E2E environments','pact','contracts',
`consumer assumes field "total"
provider renames it
discover breakage after deploy`,
`consumer contract -> expected request/response
provider verifies contract in CI
compatibility failure blocks change`,
'Contract tests verify that independently deployed consumers/providers agree on their boundary behavior.',
{normal:{consumers:3,compatible:3},edge:{consumers:3,compatible:2}},
{mentalModel:'Test the interface agreement directly rather than recreating the entire production topology for every change.',
useWhen:['Independently deployed services/APIs','Many consumers with explicit contracts'],
avoidWhen:['Using contracts as a substitute for testing provider business logic or a few critical E2E flows'],
tradeoffs:['Fast boundary feedback','Contract/version lifecycle becomes another artifact to manage'],
tips:['Keep contracts behavior-focused','Verify in provider CI','Design backward-compatible evolution.']}),

  I('property-testing','testing','Property-based tests search input space for broken invariants','hypothesis','property',
`expect(sort([3,1,2])).toEqual([1,2,3]);
// one example`,
`for many generated arrays xs:
  ys = sort(xs)
  assert isSorted(ys)
  assert multiset(ys) == multiset(xs)`,
'Properties describe truths that should hold across many inputs; generators search for counterexamples and shrink failures.',
{normal:{examples:20,failures:0},edge:{examples:1000,failures:1}},
{mentalModel:'Specify an invariant, generate a broad input space, then minimize a failing counterexample.',
useWhen:['Parsers, algorithms, serialization, state machines and invariants'],
avoidWhen:['The expected behavior is inherently example-specific and no useful property exists'],
tradeoffs:['Broader input exploration','Requires careful generator/property design'],
tips:['Test round-trip and idempotence properties','Constrain generators to valid domains where appropriate','Keep found regressions as examples too.']}),

  I('flaky-tests','testing','A flaky test is an unreliable signal, not harmless noise','fowlerTestPyramid','signal',
`if (testFails) rerunUntilGreen();`,
`capture failure evidence
identify nondeterministic dependency
fix/quarantine with owner + deadline
restore deterministic signal`,
'If red does not reliably mean broken, teams learn to ignore red; that damages the entire delivery system.',
{normal:{runs:100,randomFailures:0},edge:{runs:100,randomFailures:7}},
{mentalModel:'A CI result is an operational signal. False positives train humans to discount it.',
useWhen:['Managing any automated test suite'],
avoidWhen:['Normalizing indefinite retry-on-failure'],
tradeoffs:['Quarantining preserves main signal','Quarantined coverage is temporarily reduced'],
tips:['Track flake rate','Freeze time/randomness/network where possible','Collect artifacts from first failure.']}),

  I('progressive-delivery','testing','Deploy progressively to limit blast radius','k8sDeploy','rollout',
`deploy 100% of instances at once
discover regression from all users`,
`1% canary -> observe
10% -> observe
50% -> observe
100%
automatic/manual rollback thresholds`,
'Canary and rolling strategies turn deployment into a monitored sequence rather than one irreversible jump.',
{normal:{percent:10,healthy:true},edge:{percent:10,healthy:false}},
{mentalModel:'Expose a small fraction first, compare health, then increase blast radius only with evidence.',
useWhen:['Services where rollout risk matters','You have meaningful health/business metrics'],
avoidWhen:['Canary cohorts are too small/noisy to detect the risk you care about'],
tradeoffs:['Lower blast radius','Longer rollout and version coexistence'],
tips:['Choose rollback signals before deployment','Keep schemas backward compatible during overlap','Separate deploy from feature exposure with flags when useful.']}),

  I('expand-contract','testing','Database migrations: expand → migrate → contract','pgLocks','migration',
`deploy app that expects renamed column
at same moment rename/drop old column`,
`1 expand: add new compatible schema
2 deploy code supporting both
3 backfill/migrate
4 switch reads/writes
5 contract old schema later`,
'Rolling deployments mean old and new application versions coexist; schema changes must tolerate that overlap.',
{normal:{versions:2,compatible:true},edge:{versions:2,compatible:false}},
{mentalModel:'Treat schema evolution as a multi-release protocol between application versions and stored data.',
useWhen:['Zero/low-downtime systems','Rolling/canary deployments'],
avoidWhen:['Assuming one atomic deploy replaces every process instantly'],
tradeoffs:['Safer rollback/rollout','Temporary duplication and migration complexity'],
tips:['Backfill idempotently','Measure remaining old-format rows','Delay destructive cleanup.']})
];
