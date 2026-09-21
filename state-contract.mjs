import assert from 'node:assert/strict';
import { createDefaultState, normalizeState, reduceState, countComfortable, STATE_SCHEMA_VERSION } from './state-model.js';

const lessons=[{id:'a',topic:'one',debug:{options:['a','b','c','d']}},{id:'b',topic:'two'}];
const topics=[{id:'one'},{id:'two'}];
let state=normalizeState({
  current:'b',topic:'removed',comfortable:{a:true,removed:true},code:{a:'x',removed:'y'},
  mastery:{a:[true,false,true,false],removed:[true]},search:'abc',
  metrics:{a:{duration:12},removed:{duration:99}},nodeMetrics:{b:{memory:{rss:100}}},debug:{a:{answer:2,revealed:true}}
},lessons,topics);
assert.equal(state.schemaVersion,STATE_SCHEMA_VERSION);
assert.equal(state.current,'b');
assert.equal(state.topic,'two');
assert.deepEqual(state.comfortable,{a:true});
assert.deepEqual(state.code,{a:'x'});
assert.deepEqual(state.mastery,{a:[true,false,true,false]});
assert.deepEqual(state.metrics,{a:{duration:12}});
assert.deepEqual(state.nodeMetrics,{b:{memory:{rss:100}}});
assert.deepEqual(state.debug,{a:{answer:2,revealed:true}});
assert.equal(countComfortable(state,lessons),1);
state=reduceState(state,{type:'OPEN_LESSON',id:'a'},{lessons,topics});
assert.equal(state.current,'a');assert.equal(state.topic,'one');
state=reduceState(state,{type:'SET_CODE',id:'a',value:'edited'},{lessons,topics});assert.equal(state.code.a,'edited');
state=reduceState(state,{type:'SET_MASTERY',id:'a',index:2,value:true},{lessons,topics});assert.equal(state.mastery.a[2],true);
state=reduceState(state,{type:'SET_METRICS',id:'a',value:{duration:5}},{lessons,topics});assert.equal(state.metrics.a.duration,5);
state=reduceState(state,{type:'SET_NODE_METRICS',id:'a',value:{memory:{rss:200}}},{lessons,topics});assert.equal(state.nodeMetrics.a.memory.rss,200);
state=reduceState(state,{type:'SET_DEBUG_ANSWER',id:'a',answer:1},{lessons,topics});assert.equal(state.debug.a.answer,1);assert.equal(state.debug.a.revealed,false);
state=reduceState(state,{type:'REVEAL_DEBUG',id:'a'},{lessons,topics});assert.equal(state.debug.a.revealed,true);
assert.equal(reduceState(state,{type:'SET_DEBUG_ANSWER',id:'a',answer:99},{lessons,topics}),state);
assert.equal(reduceState(state,{type:'SET_MASTERY',id:'a',index:4,value:true},{lessons,topics}),state);
assert.equal(reduceState(state,{type:'SET_CODE',id:'removed',value:'bad'},{lessons,topics}),state);
state=reduceState(state,{type:'SELECT_TOPIC',id:''},{lessons,topics});assert.equal(state.topic,'');
assert.deepEqual(createDefaultState(lessons,topics).comfortable,{});
console.log('State contracts passed.');
