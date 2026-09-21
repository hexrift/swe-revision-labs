import { MDN_RUNTIME, NODE } from './sources.js';
import { L } from './lesson-utils.js';

const D=(id,title,source,summary,code,visual,runner,challenge,traps=[],tips=[])=>({
  ...L(id,'debugging',title,source,summary,code,challenge.fix,code,visual,{},traps,tips,runner),
  debug:challenge
});

export const DEBUG_TOPIC={id:'debugging',title:'Advanced debugging labs',description:'Diagnose async ordering, closures, memory retention, event-loop stalls and Node runtime failures.'};

export const DEBUG_LESSONS=[
D('debug-response-json','Response object mistaken for parsed JSON',MDN_RUNTIME.debugging,
'A fulfilled fetch promise gives a Response object. The debugger should lead you from the thrown TypeError to the wrong value shape.',
`async function load(){
  const response = { ok:true, json: async()=>({members:['Ada']}) };
  showHeroes(response);
}
function showHeroes(json){
  for(const hero of json.members) console.log(hero);
}
load();`,
'flow','worker',{
  symptom:'TypeError: json.members is not iterable.',
  question:'At the breakpoint inside showHeroes(), which observation most directly identifies the root cause?',
  options:['The call stack is too deep','json is a Response-like object rather than parsed JSON','for...of cannot iterate arrays','The event loop has not started'],answer:1,
  next:'Inspect the current scope and the actual runtime value of json before changing code.',
  root:'The wrong abstraction crossed the function boundary: the caller passed a response wrapper, not the parsed body.',
  fix:`const data = await response.json();\nshowHeroes(data);`
},['Do not “fix” the loop before inspecting the actual value.'],['Pause where the bad value is consumed; inspect scope, type and call stack.']),

D('debug-var-loop-closure','Closure captures one var binding in a loop',MDN_RUNTIME.debugging,
'All callbacks read the same function-scoped var binding after the loop finishes.',
`const callbacks=[];
for(var i=0;i<3;i++) callbacks.push(()=>i);
console.log(callbacks.map(fn=>fn()));`,
'closure','worker',{
  symptom:'Expected [0,1,2], observed [3,3,3].',
  question:'What should you inspect first to distinguish a closure problem from an array/map problem?',
  options:['Network panel','The lexical binding captured by each callback','CSS computed styles','Garbage-collector logs'],answer:1,
  next:'Pause inside one callback and inspect i plus its scope chain.',
  root:'var creates one function-scoped binding. Each closure reads that same binding after it becomes 3.',
  fix:`const callbacks=[];\nfor(let i=0;i<3;i++) callbacks.push(()=>i);`
},['The callback code itself is correct; the binding lifetime is wrong.'],['Use the debugger’s Scopes view to see what a closure actually captured.']),

D('debug-microtask-order','Promise callback runs before timer task',MDN_RUNTIME.microtasks,
'Microtasks are drained after the current stack empties and before the next task such as a timeout callback.',
`setTimeout(()=>console.log('timer'),0);
Promise.resolve().then(()=>console.log('promise'));
console.log('sync');`,
'queue','worker',{
  symptom:'Output is sync, promise, timer rather than sync, timer, promise.',
  question:'Which runtime evidence best explains the ordering?',
  options:['Promise callbacks use the microtask queue; timers are tasks','setTimeout is synchronous','Promises run on a worker thread','console.log reorders output'],answer:0,
  next:'Separate current stack, microtask queue and task queue in your execution trace.',
  root:'The promise reaction is a microtask and is processed before the timer task after synchronous code completes.',
  fix:`// No code bug. Fix the assumption or explicitly coordinate ordering with awaited promises.`
},['Do not debug scheduling by reading source top-to-bottom only.'],['Write down the queues and enqueue points before adding delays.']),

D('debug-unhandled-rejection','Rejected promise loses its error boundary',MDN_RUNTIME.promises,
'A promise rejection without a matching handler surfaces asynchronously and can look disconnected from the initiating code.',
`async function save(){ throw new Error('db failed'); }
function click(){ save(); console.log('clicked'); }
click();`,
'queue','worker',{
  symptom:'clicked logs, then an unhandled rejection appears.',
  question:'What is the strongest next debugging step?',
  options:['Wrap console.log in try/catch','Inspect the returned promise chain and find where rejection handling was dropped','Increase the timeout','Force garbage collection'],answer:1,
  next:'Trace the promise returned by save() and verify every call boundary either awaits or returns it.',
  root:'The caller starts async work but neither awaits, returns nor handles the rejected promise.',
  fix:`async function click(){\n  try { await save(); } catch(error) { console.error(error); }\n}`
},['try/catch around a non-awaited async call does not catch its later rejection.'],['When debugging promises, trace ownership of the returned promise.']),

D('debug-stale-closure','Stale closure keeps an old value',MDN_RUNTIME.debugging,
'A callback can legally retain the lexical value/environment from when it was created, producing behavior that looks like stale state.',
`function makeLogger(value){ return ()=>console.log(value); }
let value='old';
const log=makeLogger(value);
value='new';
log();`,
'closure','worker',{
  symptom:'Logger prints old after the outer variable changed to new.',
  question:'Which debugger view is most useful?',
  options:['Network waterfall','Scopes/closure environment on the callback','DOM accessibility tree','CPU flame graph'],answer:1,
  next:'Pause inside log() and inspect the closure’s captured binding/value.',
  root:'The function parameter value inside makeLogger belongs to that invocation’s lexical environment.',
  fix:`const log=()=>console.log(value); // if the intended behavior is to read the current outer binding`
},['Not every stale value is a race condition.'],['Confirm which lexical environment owns the binding.']),

D('debug-recursion-stack','Recursive base case does not converge',MDN_RUNTIME.callstack,
'Recursive calls grow the call stack. If input does not move toward a base case, the stack eventually overflows.',
`function walk(n){
  if(n===0) return;
  return walk(n+1);
}
walk(1);`,
'stack','worker',{
  symptom:'Maximum call stack size exceeded.',
  question:'What should you verify before increasing any stack/runtime limit?',
  options:['Whether each recursive call moves toward the base case','Whether heapUsed is low','Whether the page has too many CSS rules','Whether DNS succeeded'],answer:0,
  next:'Inspect successive stack frames and compare n across frames.',
  root:'n increases away from the only base case.',
  fix:`function walk(n){ if(n===0)return; return walk(n-1); }`
},['A stack overflow is often a termination-condition bug, not “insufficient memory”.'],['Compare arguments across adjacent stack frames.']),

D('debug-dom-listener-leak','DOM listeners retain detached state',MDN_RUNTIME.debugging,
'Long-lived event targets and closures can keep application state reachable after UI elements are removed.',
`const state={payload:new Array(100000).fill('x')};
function mount(button){
  window.addEventListener('resize',()=>console.log(state.payload.length));
  button.remove();
}`, 'memory','dom',{
  symptom:'Repeated mount/unmount cycles increase retained memory.',
  question:'Which evidence best tests the retention hypothesis?',
  options:['A heap snapshot/retainer path showing window → listener → closure → state','A slower network request','A syntax error','Higher DNS latency'],answer:0,
  next:'Inspect listener registrations and heap retainers after the DOM node is removed.',
  root:'The window listener remains registered and its closure keeps state reachable.',
  fix:`const onResize=()=>console.log(state.payload.length);\nwindow.addEventListener('resize',onResize);\n// on unmount:\nwindow.removeEventListener('resize',onResize);`
},['Removing a DOM node does not unregister listeners attached to another long-lived target.'],['Debug leaks by finding retainers, not by watching one heap number.']),

D('debug-main-thread-jank','Synchronous JavaScript blocks browser responsiveness',MDN_RUNTIME.debugging,
'A long synchronous task occupies the browser main thread, delaying timers, input and rendering.',
`const end=performance.now()+250;
while(performance.now()<end) {}
console.log('done');`, 'render-pipeline','dom',{
  symptom:'UI input and rendering pause for roughly 250 ms.',
  question:'Which measurement most directly confirms main-thread blocking in this lab?',
  options:['DOM node count','Event-loop delay / long-task duration','Cookie count','HTTP status code'],answer:1,
  next:'Run the snippet and compare measured wall time, timer delay and long-task entries.',
  root:'The synchronous loop monopolizes the same main thread that processes browser UI work.',
  fix:`// Break the job into smaller chunks or move CPU-heavy work to a Worker when appropriate.`
},['Async syntax alone does not make synchronous CPU work non-blocking.'],['Measure event-loop delay and long tasks, not just total function duration.']),

D('debug-node-event-loop','Node event loop is busy, not the database',NODE.perf,
'High request latency with high event-loop utilization can indicate JavaScript callbacks are consuming the loop even when downstream I/O is healthy.',
`const until=performance.now()+400;
while(performance.now()<until) Math.sqrt(Math.random());`, 'node-performance','node-model',{
  symptom:'Latency spikes while database timings remain normal.',
  question:'Which pair of measurements best tests event-loop saturation?',
  options:['RSS and DNS cache','eventLoopUtilization/event-loop delay together with CPU time','Filesystem path and TLS version','ArrayBuffer length and locale'],answer:1,
  next:'Measure ELU/event-loop delay and CPU over the same workload interval.',
  root:'A CPU-heavy JavaScript callback can keep the Node event loop active and delay unrelated callbacks.',
  fix:`// Bound/split CPU work or move repeated CPU-intensive jobs to worker_threads.`
},['ELU is not identical to process CPU utilization.'],['Correlate ELU, CPU and latency over the same time window.']),

D('debug-node-rss','RSS rises while heapUsed stays flat',NODE.process,
'Node process memory includes more than V8 heap: external objects, ArrayBuffers/Buffers, code and allocator behavior all contribute to RSS.',
`const buffers=[];
setInterval(()=>buffers.push(Buffer.alloc(4*1024*1024)),100);`, 'node-memory','node-model',{
  symptom:'RSS climbs but heapUsed changes only slightly.',
  question:'What should you inspect next?',
  options:['Only heapUsed again','external and arrayBuffers alongside RSS','CSS paint timing','Promise microtask count only'],answer:1,
  next:'Compare process.memoryUsage() fields over time and correlate growth with Buffer allocation.',
  root:'Buffer backing memory contributes to external/ArrayBuffer memory and process RSS, not only V8 heapUsed.',
  fix:`// Bound/release Buffer retention and monitor rss, external and arrayBuffers together.`
},['Stable heapUsed does not prove stable process memory.'],['Use the whole process.memoryUsage() object.']),

D('debug-node-backpressure','Stream producer outruns consumer',NODE.stream,
'Ignoring writable backpressure lets buffered data and pending work accumulate when the consumer is slower.',
`for await (const chunk of source) destination.write(chunk);`, 'node-stream','node-model',{
  symptom:'Memory and latency grow during sustained streaming load.',
  question:'Which observation points most directly at missing backpressure?',
  options:['write() frequently returns false while producer keeps writing','The module uses ESM','process.version is recent','The URL has query parameters'],answer:0,
  next:'Inspect write() return values, buffered length/highWaterMark and drain events.',
  root:'The producer ignores the consumer’s pressure signal and continues feeding the internal queue.',
  fix:`for await (const chunk of source){\n  if(!destination.write(chunk)) await once(destination,'drain');\n}`
},['Throughput mismatches surface as memory pressure when buffering is unbounded.'],['Measure buffered bytes and honor drain/backpressure.']),

D('debug-node-diagnostic-report','Crash only happens under production load',NODE.report,
'A Node diagnostic report can capture JavaScript/native stacks, heap statistics, libuv handles, platform and resource usage around serious failures.',
`process.on('uncaughtException',error=>console.error(error));`, 'node-os','node-model',{
  symptom:'Rare production crash cannot be reproduced locally.',
  question:'Which artifact gives the broadest runtime snapshot at failure time using Node built-ins?',
  options:['A CSS source map','process diagnostic report','A package-lock diff','A single console.log'],answer:1,
  next:'Enable or trigger a diagnostic report for the failure path, taking care with environment/network data exposure.',
  root:'A sparse log line does not preserve enough runtime context for postmortem analysis.',
  fix:`process.report.writeReport(error);`
},['Diagnostic reports can contain sensitive process/environment details.'],['Use reports intentionally in development/test/production incident workflows.'])
];