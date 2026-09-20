import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const source = await fs.readFile(new URL('./app.js', import.meta.url), 'utf8');

assert.match(source, /renderCodeVisual, renderInterviewVisual, renderArchitectureVisual/);
assert.match(source, /if \(pattern\.category === 'architecture'\) return renderArchitectureVisual/);
assert.match(source, /if \(pattern\.interviewModel\) return renderInterviewVisual/);
assert.match(source, /if \(location\.hash === target\)[\s\S]*?render\(\)/);
assert.match(source, /syncStateToRoute\(state, r, getPattern\)/);
assert.match(source, /data-mastery-index/);
assert.match(source, /state\.scenarios\[pattern\.id\]/);
assert.match(source, /document\.body\.classList\.remove\('drawer-open'\)/);
assert.match(source, /unregisterLegacyServiceWorkers\(\)/);
assert.match(source, /SWE Revision Labs render failed/);

console.log('Application integration contracts passed.');
