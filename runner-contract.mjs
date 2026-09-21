import assert from 'node:assert/strict';
import { domSource, workerSource } from './runner.js';

const worker=workerSource();
assert.doesNotThrow(()=>new Function(worker),'generated worker source must be valid JavaScript');
assert.match(worker,/new AsyncFunction\('\"use strict\";\\n'\+code\)/,'worker must preserve the generated function newline');

const dom=domSource('document.body.innerHTML="</script>";','test-token');
assert.doesNotMatch(dom,/new AsyncFunction/,'DOM runner must not require CSP-blocked eval');
assert.match(dom,/await \(async\(\)=>\{/,'DOM runner should execute code in an inline async function');
assert.match(dom,/token=\"test-token\"/,'DOM source should carry its message token');
assert.ok(dom.includes('<\\/script>'),'user code/script boundaries must remain safe inside srcdoc');
const domScript=dom.match(/<script>([\s\S]*)<\/script>/)?.[1];
assert.ok(domScript,'DOM source should contain one executable script');
assert.doesNotThrow(()=>new Function(domScript),'generated DOM source must be valid JavaScript');
console.log('Runner contracts passed.');
