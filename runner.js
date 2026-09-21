const WORKER_TIMEOUT=2200;

function heapSnapshot(){
  const memory=performance && performance.memory;
  if(!memory) return null;
  return {
    usedJSHeapSize:Number(memory.usedJSHeapSize)||0,
    totalJSHeapSize:Number(memory.totalJSHeapSize)||0,
    jsHeapSizeLimit:Number(memory.jsHeapSizeLimit)||0
  };
}

export function workerSource(){
  return `
const stringify=value=>{
  if(typeof value==='string') return value;
  if(typeof value==='bigint') return value+'n';
  if(typeof value==='symbol') return value.toString();
  try{return JSON.stringify(value,(key,val)=>typeof val==='bigint'?val+'n':val,2)}catch{return String(value)}
};
const lines=[];
for(const level of ['log','info','warn','error']) console[level]=(...args)=>lines.push(args.map(stringify).join(' '));
const heap=()=>performance&&performance.memory?{
  usedJSHeapSize:Number(performance.memory.usedJSHeapSize)||0,
  totalJSHeapSize:Number(performance.memory.totalJSHeapSize)||0,
  jsHeapSizeLimit:Number(performance.memory.jsHeapSizeLimit)||0
}:null;
self.onerror=event=>postMessage({type:'done',ok:false,lines,error:event.message||'Runtime error'});
self.onunhandledrejection=event=>postMessage({type:'done',ok:false,lines,error:String(event.reason?.stack||event.reason)});
self.onmessage=async event=>{
  const {code}=event.data;
  const memoryBefore=heap();
  const scheduledAt=performance.now();
  const delayPromise=new Promise(resolve=>setTimeout(()=>resolve(performance.now()-scheduledAt),0));
  const start=performance.now();
  try{
    const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
    await new AsyncFunction('"use strict";\\n'+code)();
    const duration=performance.now()-start;
    const eventLoopDelay=await delayPromise;
    const memoryAfter=heap();
    postMessage({type:'done',ok:true,lines,duration,eventLoopDelay,memoryBefore,memoryAfter,realm:'worker'});
  }catch(error){
    const duration=performance.now()-start;
    const eventLoopDelay=await delayPromise;
    const memoryAfter=heap();
    postMessage({type:'done',ok:false,lines,error:String(error?.stack||error),duration,eventLoopDelay,memoryBefore,memoryAfter,realm:'worker'});
  }
};`;
}

export function runWorkerCode(code,{timeout=WORKER_TIMEOUT}={}){
  return new Promise(resolve=>{
    const url=URL.createObjectURL(new Blob([workerSource()],{type:'text/javascript'}));
    const worker=new Worker(url);
    let settled=false;
    const finish=result=>{
      if(settled) return;
      settled=true;
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(result);
    };
    const timer=setTimeout(()=>finish({ok:false,lines:[],error:`Stopped after ${timeout} ms. The snippet kept this JavaScript worker busy beyond the safety budget.`,timeout:true,duration:timeout,realm:'worker'}),timeout);
    worker.onmessage=event=>{
      if(event.data?.type!=='done') return;
      clearTimeout(timer);
      finish(event.data);
    };
    worker.onerror=event=>{
      clearTimeout(timer);
      finish({ok:false,lines:[],error:event.message||'Worker failed',realm:'worker'});
    };
    worker.postMessage({code});
  });
}

function safeScript(code){
  return JSON.stringify(String(code)).replace(/<\/script/gi,'<\\/script');
}

export function domSource(code,token){
  const source=safeScript(code);
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src 'none'; img-src data:; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'"><style>body{font:14px/1.5 system-ui;padding:14px;margin:0;color:#171717;background:#fff}button,input{font:inherit}pre{white-space:pre-wrap}</style></head><body><div id="root"></div><script>
      const token=${JSON.stringify(token)};
      const lines=[];
      const stringify=v=>{try{return typeof v==='string'?v:JSON.stringify(v)}catch{return String(v)}};
      for(const level of ['log','info','warn','error']) console[level]=(...args)=>lines.push(args.map(stringify).join(' '));
      const heap=()=>performance&&performance.memory?{usedJSHeapSize:Number(performance.memory.usedJSHeapSize)||0,totalJSHeapSize:Number(performance.memory.totalJSHeapSize)||0,jsHeapSizeLimit:Number(performance.memory.jsHeapSizeLimit)||0}:null;
      const send=payload=>parent.postMessage({__sweSandbox:true,token,...payload},'*');
      const nativeSetTimeout=window.setTimeout.bind(window);
      (async()=>{
        const nodeBefore=document.getElementsByTagName('*').length;
        let mutations=0;
        const observer=new MutationObserver(records=>{mutations+=records.reduce((sum,record)=>sum+record.addedNodes.length+record.removedNodes.length,0)});
        observer.observe(document.documentElement,{subtree:true,childList:true});
        let longTaskCount=0,longTaskMs=0;
        let longObserver=null;
        if(typeof PerformanceObserver!=='undefined'&&PerformanceObserver.supportedEntryTypes?.includes('longtask')){
          longObserver=new PerformanceObserver(list=>{for(const entry of list.getEntries()){longTaskCount++;longTaskMs+=entry.duration}});
          longObserver.observe({type:'longtask',buffered:false});
        }
        const memoryBefore=heap();
        const scheduledAt=performance.now();
        const delayPromise=new Promise(r=>nativeSetTimeout(()=>r(performance.now()-scheduledAt),0));
        const start=performance.now();
        try{
          const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
          await new AsyncFunction(${source})();
          const duration=performance.now()-start;
          const eventLoopDelay=await delayPromise;
          await new Promise(r=>nativeSetTimeout(r,0));
          observer.disconnect(); longObserver?.disconnect();
          const memoryAfter=heap();
          const nodeAfter=document.getElementsByTagName('*').length;
          send({ok:true,lines,duration,eventLoopDelay,memoryBefore,memoryAfter,nodeBefore,nodeAfter,domNodeDelta:nodeAfter-nodeBefore,mutations,longTaskCount,longTaskMs,realm:'browser-main-thread'});
        }catch(error){
          const duration=performance.now()-start;
          const eventLoopDelay=await delayPromise;
          observer.disconnect(); longObserver?.disconnect();
          const memoryAfter=heap();
          const nodeAfter=document.getElementsByTagName('*').length;
          send({ok:false,lines,error:String(error&&error.stack||error),duration,eventLoopDelay,memoryBefore,memoryAfter,nodeBefore,nodeAfter,domNodeDelta:nodeAfter-nodeBefore,mutations,longTaskCount,longTaskMs,realm:'browser-main-thread'});
        }
      })();
    <\/script></body></html>`;
}

export function runDomExample(code,host,{timeout=3500}={}){
  return new Promise(resolve=>{
    host.innerHTML='';
    const iframe=document.createElement('iframe');
    iframe.className='browser-sandbox';
    iframe.setAttribute('sandbox','allow-scripts');
    iframe.setAttribute('title','Sandboxed browser JavaScript output');
    const token=Math.random().toString(36).slice(2);
    iframe.srcdoc=domSource(code,token);
    host.append(iframe);
    let settled=false;
    const cleanup=()=>window.removeEventListener('message',onMessage);
    const finish=result=>{
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      cleanup();
      if(result.timeout) iframe.remove();
      resolve(result);
    };
    const onMessage=event=>{
      if(event.source!==iframe.contentWindow||!event.data?.__sweSandbox||event.data.token!==token) return;
      finish(event.data);
    };
    window.addEventListener('message',onMessage);
    const timer=setTimeout(()=>finish({ok:false,lines:[],error:'Browser example did not finish in time.',timeout:true,duration:timeout,realm:'browser-main-thread'}),timeout);
  });
}

export function nodeProbeFor(lessonId){
  const workloads={
    'node-buffer':`const { Buffer } = await import('node:buffer');\nconst buffers=[]; for(let i=0;i<64;i++) buffers.push(Buffer.alloc(1024*1024));\nconsole.log('allocated bytes', buffers.reduce((n,b)=>n+b.length,0));`,
    'node-buffer-unsafe':`const { Buffer } = await import('node:buffer');\nconst buffers=[]; for(let i=0;i<64;i++){ const b=Buffer.allocUnsafe(1024*1024); b.fill(1); buffers.push(b); }\nconsole.log('initialized bytes', buffers.length*1024*1024);`,
    'node-memory-usage':`const retained=[]; for(let i=0;i<300000;i++) retained.push({i,label:'item-'+i,payload:'x'.repeat(32)}); console.log('retained',retained.length);`,
    'node-v8-heap':`const arrays=[]; for(let i=0;i<1000;i++) arrays.push(new Array(1000).fill(i)); console.log('arrays',arrays.length);`,
    'node-event-loop-util':`const until=performance.now()+350; while(performance.now()<until) Math.sqrt(Math.random()); console.log('busy loop finished');`,
    'node-workers':`const { Worker } = await import('node:worker_threads');\nawait Promise.all(Array.from({length:4},()=>new Promise((resolve,reject)=>{ const worker=new Worker('let n=0; for(let i=0;i<25_000_000;i++) n+=i; postMessage(n)',{eval:true}); worker.once('message',resolve); worker.once('error',reject); }))); console.log('workers finished');`,
    'node-streams':`const { Readable, Writable } = await import('node:stream');\nconst source=Readable.from(Array.from({length:10000},()=>Buffer.alloc(1024)));\nawait new Promise((resolve,reject)=>source.pipe(new Writable({write(chunk,enc,cb){cb()}})).on('finish',resolve).on('error',reject)); console.log('streamed');`,
    'node-backpressure':`const { Writable } = await import('node:stream');\nconst sink=new Writable({highWaterMark:16*1024,write(chunk,enc,cb){setTimeout(cb,1)}});\nfor(let i=0;i<3000;i++){ if(!sink.write(Buffer.alloc(1024))) await new Promise(r=>sink.once('drain',r)); } sink.end(); await new Promise(r=>sink.once('finish',r)); console.log('writes completed with backpressure');`
    ,'debug-node-event-loop':`const until=performance.now()+400; while(performance.now()<until) Math.sqrt(Math.random()); console.log('busy loop complete');`
    ,'debug-node-rss':`const buffers=[]; for(let i=0;i<64;i++) buffers.push(Buffer.alloc(4*1024*1024)); console.log('retained buffer MiB',buffers.length*4);`
    ,'debug-node-backpressure':`const { Writable } = await import('node:stream'); const sink=new Writable({highWaterMark:8*1024,write(chunk,enc,cb){setTimeout(cb,2)}}); let falseWrites=0; for(let i=0;i<1500;i++){ if(!sink.write(Buffer.alloc(1024))){falseWrites++; await new Promise(r=>sink.once('drain',r));}} sink.end(); await new Promise(r=>sink.once('finish',r)); console.log('backpressure signals',falseWrites);`
    ,'debug-node-diagnostic-report':`const report=process.report.getReport(new Error('debug probe')); console.log('report version',report.header.reportVersion,'libuv handles',report.libuv?.length??0);`
  };
  const workload=workloads[lessonId]||`const values=[]; for(let i=0;i<200000;i++) values.push({i,value:i*i}); console.log('work items',values.length);`;
  return `// Save as resource-probe.mjs and run: node resource-probe.mjs\nimport process from 'node:process';\nimport { performance } from 'node:perf_hooks';\n\nconst bytes=n=>Math.round(n);\nconst beforeMemory=process.memoryUsage();\nconst beforeCpu=process.cpuUsage();\nconst beforeResource=process.resourceUsage();\nconst beforeElu=performance.eventLoopUtilization();\nconst started=performance.now();\n\n${workload}\n\nawait new Promise(resolve=>setImmediate(resolve));\nconst durationMs=performance.now()-started;\nconst memory=process.memoryUsage();\nconst cpu=process.cpuUsage(beforeCpu);\nconst resource=process.resourceUsage();\nconst elu=performance.eventLoopUtilization(beforeElu);\nconst delta=(a,b)=>bytes((b??0)-(a??0));\n\nconsole.log(JSON.stringify({\n  node:process.version,\n  platform:process.platform,\n  arch:process.arch,\n  durationMs,\n  memory:{\n    rss:memory.rss,\n    rssDelta:delta(beforeMemory.rss,memory.rss),\n    heapUsed:memory.heapUsed,\n    heapUsedDelta:delta(beforeMemory.heapUsed,memory.heapUsed),\n    heapTotal:memory.heapTotal,\n    external:memory.external,\n    externalDelta:delta(beforeMemory.external,memory.external),\n    arrayBuffers:memory.arrayBuffers,\n    arrayBuffersDelta:delta(beforeMemory.arrayBuffers,memory.arrayBuffers)\n  },\n  cpu:{userMs:cpu.user/1000,systemMs:cpu.system/1000},\n  eventLoop:{activeMs:elu.active,idleMs:elu.idle,utilization:elu.utilization},\n  resource:{\n    maxRSSKiB:resource.maxRSS,\n    minorPageFault:resource.minorPageFault-beforeResource.minorPageFault,\n    majorPageFault:resource.majorPageFault-beforeResource.majorPageFault,\n    fsRead:resource.fsRead-beforeResource.fsRead,\n    fsWrite:resource.fsWrite-beforeResource.fsWrite,\n    voluntaryContextSwitches:resource.voluntaryContextSwitches-beforeResource.voluntaryContextSwitches,\n    involuntaryContextSwitches:resource.involuntaryContextSwitches-beforeResource.involuntaryContextSwitches\n  }\n},null,2));`;
}
