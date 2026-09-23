const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const bytes=value=>{
  const n=Number(value);
  if(!Number.isFinite(n)) return '—';
  const abs=Math.abs(n);
  const units=['B','KiB','MiB','GiB'];
  let v=abs,i=0;
  while(v>=1024&&i<units.length-1){v/=1024;i++}
  const out=(v>=100?Math.round(v):v>=10?v.toFixed(1):v.toFixed(2))+' '+units[i];
  return n<0?'-'+out:out;
};
const ms=value=>Number.isFinite(Number(value))?Number(value).toFixed(Number(value)>=100?0:2)+' ms':'—';
const pct=value=>Number.isFinite(Number(value))?(Number(value)*100).toFixed(1)+'%':'—';

function metric(label,value,detail='',tone=''){
  return `<div class="actual-metric ${tone}"><span>${esc(label)}</span><strong>${esc(value)}</strong>${detail?`<small>${esc(detail)}</small>`:''}</div>`;
}

export function renderBrowserMetrics(result){
  if(!result) return `<div class="actual-empty"><strong>No measurements yet.</strong><p>Run the JavaScript above. This panel only displays values returned by the browser runtime.</p></div>`;
  const memoryBefore=result.memoryBefore?.usedJSHeapSize;
  const memoryAfter=result.memoryAfter?.usedJSHeapSize;
  const heapDelta=Number.isFinite(memoryBefore)&&Number.isFinite(memoryAfter)?memoryAfter-memoryBefore:null;
  const cards=[
    metric('Wall time',ms(result.duration),'Measured with performance.now()'),
    metric('Event-loop delay',ms(result.eventLoopDelay),'0 ms timer delayed by the executed code',Number(result.eventLoopDelay)>50?'hot':''),
  ];
  if(result.realm==='browser-main-thread'){
    cards.push(metric('DOM node delta',Number.isFinite(result.domNodeDelta)?String(result.domNodeDelta):'—','Nodes after − nodes before',Number(result.domNodeDelta)>100?'hot':''));
    cards.push(metric('DOM mutations',Number.isFinite(result.mutations)?String(result.mutations):'—','Observed child-list additions/removals'));
    cards.push(metric('Long tasks',Number.isFinite(result.longTaskCount)?String(result.longTaskCount):'unsupported','PerformanceObserver longtask when available',Number(result.longTaskCount)>0?'hot':''));
    cards.push(metric('Long-task time',Number.isFinite(result.longTaskMs)?ms(result.longTaskMs):'unsupported','Sum of observed long-task durations'));
  }
  if(heapDelta!==null){
    cards.push(metric('JS heap delta',bytes(heapDelta),'Browser-exposed performance.memory; Chromium-specific',heapDelta>1024*1024?'hot':''));
    cards.push(metric('JS heap after',bytes(memoryAfter),'Browser-exposed performance.memory'));
  return `<div class="actual-head"><div><p class="eyebrow">Measured in this browser</p><h3>${esc(result.realm==='browser-main-thread'?'Browser main thread':'Disposable JavaScript worker')}</h3></div><span>${result.ok?'completed':'failed / stopped'}</span></div><div class="actual-grid">${cards.join('')}</div>${result.timeout?'<p class="actual-warning">The safety timeout terminated the execution. The reported duration is the timeout budget, not completion time.</p>':''}`;
}

export function renderNodeMetrics(data){
  if(!data) return `<div class="actual-empty"><strong>No Node measurements imported.</strong><p>Run the generated Node probe locally and paste its JSON result here. Nothing in this panel is estimated.</p></div>`;
  const memory=data.memory||{};
  const cpu=data.cpu||{};
  const elu=data.eventLoop||{};
  const resource=data.resource||{};
  const cards=[
    metric('Wall time',ms(data.durationMs),'Measured by node:perf_hooks'),
    metric('CPU user',ms(cpu.userMs),'process.cpuUsage() delta'),
    metric('CPU system',ms(cpu.systemMs),'process.cpuUsage() delta'),
    metric('RSS',bytes(memory.rss),'Resident process memory'),
    metric('RSS delta',bytes(memory.rssDelta),'After − before'),
    metric('V8 heap used',bytes(memory.heapUsed),'process.memoryUsage().heapUsed'),
    metric('Heap-used delta',bytes(memory.heapUsedDelta),'After − before'),
    metric('External memory',bytes(memory.external),'C++ objects bound to JS objects'),
    metric('External delta',bytes(memory.externalDelta),'After − before'),
    metric('ArrayBuffer memory',bytes(memory.arrayBuffers),'Includes Node Buffer backing memory'),
    metric('ArrayBuffer delta',bytes(memory.arrayBuffersDelta),'After − before'),
    metric('Event-loop utilization',pct(elu.utilization),'performance.eventLoopUtilization()'),
    metric('Max RSS',Number.isFinite(Number(resource.maxRSSKiB))?bytes(Number(resource.maxRSSKiB)*1024):'—','process.resourceUsage().maxRSS'),
    metric('Minor page faults',String(resource.minorPageFault??'—'),'Delta during workload'),
    metric('Major page faults',String(resource.majorPageFault??'—'),'Delta during workload'),
    metric('Voluntary context switches',String(resource.voluntaryContextSwitches??'—'),'Delta during workload'),
    metric('Involuntary context switches',String(resource.involuntaryContextSwitches??'—'),'Delta during workload')
  ];
  return `<div class="actual-head"><div><p class="eyebrow">Measured by Node.js</p><h3>${esc(data.node||'Node')} · ${esc(data.platform||'')} ${esc(data.arch||'')}</h3></div><span>imported JSON</span></div><div class="actual-grid">${cards.join('')}</div>`;
}