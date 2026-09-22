import assert from 'node:assert/strict';
import { createDefaultState, normalizeState, reduceState, countComfortable, countVisited, countCompletedTopics, STATE_SCHEMA_VERSION } from './state-model.js';

const lessons=[{id:'a',topic:'one',debug:{options:['a','b','c','d']}},{id:'b',topic:'two'}];
const topics=[{id:'one'},{id:'two'}];
const quizzes=[{topic:'one',questions:[{options:['a','b'],answer:1},{options:['a','b'],answer:0}]}];
const challenges=[{id:'first',seconds:75},{id:'second',seconds:90}];
let state=normalizeState({
  current:'b',topic:'removed',comfortable:{a:true,removed:true},code:{a:'x',removed:'y'},
  visited:{},
  mastery:{a:[true,false,true,false],removed:[true]},search:'abc',
  metrics:{a:{duration:12},removed:{duration:99}},nodeMetrics:{b:{memory:{rss:100}}},debug:{a:{answer:2,revealed:true}},
  quiz:{one:{answers:[1,0],submitted:true,passed:true},removed:{answers:[99],submitted:true,passed:true}},
  challenge:{currentId:'first',startedAt:1000,attempts:{first:1,removed:8},completed:['first','removed'],results:{first:{passed:true,duration:4,output:'ok'},removed:{passed:true}},code:{first:'x',removed:'y'}}
},lessons,topics,quizzes,challenges,1000);
assert.equal(state.schemaVersion,STATE_SCHEMA_VERSION);
assert.equal(state.current,'b');
assert.equal(state.topic,'two');
assert.deepEqual(state.comfortable,{a:true});
assert.deepEqual(state.visited,{a:true});
assert.deepEqual(state.code,{a:'x'});
assert.deepEqual(state.mastery,{a:[true,false,true,false]});
assert.deepEqual(state.metrics,{a:{duration:12}});
assert.deepEqual(state.nodeMetrics,{b:{memory:{rss:100}}});
assert.deepEqual(state.debug,{a:{answer:2,revealed:true}});
assert.deepEqual(state.quiz,{one:{answers:[1,0],submitted:true,passed:true}});
assert.deepEqual(state.challenge,{currentId:'first',startedAt:1000,attempts:{first:1},completed:['first'],results:{first:{passed:true,timedOut:false,clockExpired:false,duration:4,output:'ok'}},code:{first:'x'}});
const expiredState=normalizeState({challenge:{currentId:'first',startedAt:1000}},lessons,topics,quizzes,challenges,76001);
assert.equal(expiredState.challenge.startedAt,null,'an expired persisted challenge timer must be abandoned');
assert.equal(countComfortable(state,lessons),1);
assert.equal(countVisited(state,lessons),1);
assert.equal(countCompletedTopics(state,topics),1);
state=reduceState(state,{type:'OPEN_LESSON',id:'a'},{lessons,topics,quizzes});
assert.equal(state.current,'a');assert.equal(state.topic,'one');
state=reduceState(state,{type:'SET_CODE',id:'a',value:'edited'},{lessons,topics,quizzes});assert.equal(state.code.a,'edited');
state=reduceState(state,{type:'SET_MASTERY',id:'a',index:2,value:true},{lessons,topics,quizzes});assert.equal(state.mastery.a[2],true);
state=reduceState(state,{type:'SET_METRICS',id:'a',value:{duration:5}},{lessons,topics,quizzes});assert.equal(state.metrics.a.duration,5);
state=reduceState(state,{type:'SET_NODE_METRICS',id:'a',value:{memory:{rss:200}}},{lessons,topics,quizzes});assert.equal(state.nodeMetrics.a.memory.rss,200);
state=reduceState(state,{type:'SET_DEBUG_ANSWER',id:'a',answer:1},{lessons,topics,quizzes});assert.equal(state.debug.a.answer,1);assert.equal(state.debug.a.revealed,false);
state=reduceState(state,{type:'REVEAL_DEBUG',id:'a'},{lessons,topics,quizzes});assert.equal(state.debug.a.revealed,true);
state=reduceState(state,{type:'RETAKE_QUIZ',topic:'one'},{lessons,topics,quizzes});
state=reduceState(state,{type:'SET_QUIZ_ANSWER',topic:'one',question:0,answer:0},{lessons,topics,quizzes});assert.equal(state.quiz.one.answers[0],0);assert.equal(state.quiz.one.submitted,false);
state=reduceState(state,{type:'SET_QUIZ_ANSWER',topic:'one',question:1,answer:0},{lessons,topics,quizzes});
state=reduceState(state,{type:'SET_QUIZ_ANSWER',topic:'one',question:0,answer:1},{lessons,topics,quizzes});
state=reduceState(state,{type:'SUBMIT_QUIZ',topic:'one'},{lessons,topics,quizzes});assert.equal(state.quiz.one.passed,true);
assert.equal(reduceState(state,{type:'SET_QUIZ_ANSWER',topic:'one',question:0,answer:0},{lessons,topics,quizzes}),state);
state=reduceState(state,{type:'RETAKE_QUIZ',topic:'one'},{lessons,topics,quizzes});assert.deepEqual(state.quiz.one.answers,[null,null]);assert.equal(state.quiz.one.submitted,false);assert.equal(state.quiz.one.passed,false);
const challengeContext={lessons,topics,quizzes,challenges};
state=reduceState(state,{type:'SET_CHALLENGE_CODE',id:'first',value:'const answer=1;'},{...challengeContext});assert.equal(state.challenge.code.first,'const answer=1;');
state=reduceState(state,{type:'START_CHALLENGE',id:'first',startedAt:2000},challengeContext);assert.equal(state.challenge.startedAt,2000);
state=reduceState(state,{type:'RECORD_CHALLENGE_RESULT',id:'first',result:{passed:true,timedOut:false,duration:7,output:'ok'}},challengeContext);assert.equal(state.challenge.attempts.first,2);assert.equal(state.challenge.results.first.passed,true);
state=reduceState(state,{type:'NEXT_CHALLENGE'},challengeContext);assert.equal(state.challenge.currentId,'second');
state=reduceState(state,{type:'START_CHALLENGE',id:'second',startedAt:3000},challengeContext);
state=reduceState(state,{type:'RECORD_CHALLENGE_RESULT',id:'second',result:{passed:false,timedOut:false,duration:8,output:'wrong'}},challengeContext);assert.deepEqual(state.challenge.completed,['first']);assert.equal(state.challenge.results.second.passed,false);
state=reduceState(state,{type:'RESET_CHALLENGE',id:'second'},challengeContext);assert.equal(state.challenge.currentId,'second');
state=reduceState(state,{type:'RESET_CHALLENGES'},challengeContext);assert.deepEqual(state.challenge,{currentId:'first',startedAt:null,attempts:{},completed:[],results:{},code:{}});
assert.equal(reduceState(state,{type:'SET_DEBUG_ANSWER',id:'a',answer:99},{lessons,topics,quizzes}),state);
assert.equal(reduceState(state,{type:'SET_MASTERY',id:'a',index:4,value:true},{lessons,topics,quizzes}),state);
assert.equal(reduceState(state,{type:'SET_CODE',id:'removed',value:'bad'},{lessons,topics,quizzes}),state);
assert.equal(reduceState(state,{type:'SET_QUIZ_ANSWER',topic:'one',question:99,answer:0},{lessons,topics,quizzes}),state);
state=reduceState(state,{type:'SELECT_TOPIC',id:''},{lessons,topics,quizzes});assert.equal(state.topic,'');
assert.deepEqual(createDefaultState(lessons,topics).comfortable,{});
console.log('State contracts passed.');
