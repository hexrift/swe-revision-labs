// Browser lifecycle contracts. Runs the real DOM sandbox in headless Chromium
// (via Playwright) and verifies behavior that source-level contracts cannot:
// syntax-error delivery, full-animation measurement, prompt stop resolution,
// and teardown of detached learner work.
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json'};
const root=process.cwd();
const server=http.createServer(async(request,response)=>{
  try{
    const pathname=normalize(decodeURIComponent(new URL(request.url,'http://localhost').pathname));
    const file=join(root,pathname==='/'||pathname===sep?'index.html':pathname.slice(1));
    if(!file.startsWith(root)) throw new Error('outside root');
    const body=await readFile(file);
    response.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream'});
    response.end(body);
  }catch{
    response.writeHead(404);
    response.end('not found');
  }
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;

const { chromium } = await import('playwright');
async function launch(){
  const options={chromiumSandbox:false};
  try{return await chromium.launch(options)}
  catch(error){
    try{return await chromium.launch({...options,executablePath:'/opt/pw-browsers/chromium'})}
    catch{throw error}
  }
}
const browser=await launch();
try{
  const page=await browser.newPage();
  await page.goto(`${base}/index.html#home`);

  const results=await page.evaluate(async()=>{
    const { runDomExample }=await import('./runner.js');
    const { LESSONS }=await import('./curriculum.js');
    const host=document.createElement('div');
    // Keep the sandbox in the viewport: Chrome pauses rAF inside offscreen
    // cross-origin iframes, which would stall the animation scenario.
    host.style.cssText='position:fixed;top:0;left:0;width:420px;height:320px;z-index:9999;background:#fff';
    document.body.append(host);
    const out={};

    // 1. A syntax error in learner code must be reported as an error, not a timeout.
    const syntax=await runDomExample('const broken=(',host,{timeout:8000});
    out.syntax={ok:syntax.ok,timeout:!!syntax.timeout,error:String(syntax.error||'')};

    // 2. The awaited rAF lesson must complete with the whole animation measured.
    const rafLesson=LESSONS.find(lesson=>lesson.id==='request-animation-frame');
    const animation=await runDomExample(rafLesson.code,host,{timeout:15000});
    out.raf={ok:animation.ok,timeout:!!animation.timeout,duration:animation.duration,mutations:animation.mutations};

    // 3 + 4. Stop must resolve promptly with a distinct result, remove the
    // iframe, and kill detached timers scheduled by learner code.
    let probes=0;
    const onProbe=event=>{if(event.data?.__sweProbe)probes++};
    window.addEventListener('message',onProbe);
    const controller=new AbortController();
    const pendingRun=runDomExample(
      'setInterval(()=>parent.postMessage({__sweProbe:true},"*"),40); await new Promise(()=>{});',
      host,{timeout:30000,signal:controller.signal}
    );
    await new Promise(resolve=>setTimeout(resolve,400));
    const probesBeforeStop=probes;
    const stopStarted=performance.now();
    controller.abort();
    const stopResult=await pendingRun;
    const stopLatency=performance.now()-stopStarted;
    const iframesAfterStop=host.querySelectorAll('iframe').length;
    await new Promise(resolve=>setTimeout(resolve,150)); // drain in-flight messages
    const probesAtBaseline=probes;
    await new Promise(resolve=>setTimeout(resolve,500));
    window.removeEventListener('message',onProbe);
    out.stop={
      stopped:!!stopResult.stopped,
      ok:stopResult.ok,
      stopLatency,
      iframesAfterStop,
      probesBeforeStop,
      probesAfterStop:probes-probesAtBaseline
    };
    return out;
  });

  assert.equal(results.syntax.ok,false,'a syntax error must fail the run');
  assert.equal(results.syntax.timeout,false,'a syntax error must not surface as a timeout');
  assert.match(results.syntax.error,/SyntaxError/,'the SyntaxError message must reach the learner');

  assert.equal(results.raf.ok,true,'the awaited rAF lesson must complete successfully');
  assert.equal(results.raf.timeout,false,'the awaited rAF lesson must finish inside the safety budget');
  assert.ok(results.raf.duration>500,`duration must cover the animation, got ${results.raf.duration}ms`);
  assert.ok(results.raf.mutations>=100,`mutation counting must include the animation frames, got ${results.raf.mutations}`);

  assert.equal(results.stop.stopped,true,'abort must resolve with a distinct stopped result');
  assert.equal(results.stop.ok,false,'a stopped run must not read as success');
  assert.ok(results.stop.stopLatency<300,`stop must resolve promptly, took ${results.stop.stopLatency}ms`);
  assert.equal(results.stop.iframesAfterStop,0,'stop must remove the sandbox iframe');
  assert.ok(results.stop.probesBeforeStop>0,'the detached interval must be observably alive before stop');
  assert.equal(results.stop.probesAfterStop,0,'detached timers must not survive a stop');
  console.log('Browser lifecycle contracts passed.');
}finally{
  await browser.close();
  server.close();
}
