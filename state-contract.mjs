import assert from 'node:assert/strict';
import { normalizeState, countComfortable, syncStateToRoute, STATE_SCHEMA_VERSION } from './state-model.js';

const patterns = [
  { id:'a', category:'one' },
  { id:'b', category:'two' }
];
const categories = [{id:'one'},{id:'two'}];

const normalized = normalizeState({
  language:'python',
  category:'removed-category',
  current:'b',
  comfortable:{ a:true, removed:true },
  inputs:{ a:{n:5}, removed:{n:99} },
  scenarios:{ a:'edge', removed:'edge' },
  mastery:{ a:[true,false,true,false], removed:[true,true,true,true] },
  quiz:{ current:99, answers:{0:1,99:2,bad:3}, completed:true }
}, patterns, categories, 3);

assert.equal(normalized.schemaVersion, STATE_SCHEMA_VERSION);
assert.equal(normalized.language, 'python');
assert.equal(normalized.current, 'b');
assert.equal(normalized.category, 'two');
assert.deepEqual(normalized.comfortable, {a:true});
assert.deepEqual(normalized.inputs, {a:{n:5}});
assert.deepEqual(normalized.scenarios, {a:'edge'});
assert.deepEqual(normalized.mastery, {a:[true,false,true,false]});
assert.equal(normalized.quiz.current, 2);
assert.deepEqual(normalized.quiz.answers, {0:1});
assert.equal(countComfortable(normalized, patterns), 1);

const routeState = normalizeState({}, patterns, categories, 3);
const changed = syncStateToRoute(routeState, {view:'pattern',id:'b'}, id => patterns.find(p => p.id === id));
assert.equal(changed, true);
assert.equal(routeState.current, 'b');
assert.equal(routeState.category, 'two');
assert.equal(syncStateToRoute(routeState, {view:'pattern',id:'b'}, id => patterns.find(p => p.id === id)), false);

console.log('State contracts passed.');
