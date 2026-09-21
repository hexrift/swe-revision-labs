import assert from 'node:assert/strict';
import { TOPICS, LESSONS, getLesson, lessonsFor } from './curriculum.js';

assert.ok(TOPICS.length >= 10, 'expected comprehensive topic index');
assert.ok(LESSONS.length >= 100, 'expected comprehensive lesson library');

const topicIds=new Set(TOPICS.map(x=>x.id));
const lessonIds=new Set();
for(const lesson of LESSONS){
  assert.ok(!lessonIds.has(lesson.id), `duplicate lesson id: ${lesson.id}`);
  lessonIds.add(lesson.id);
  assert.ok(topicIds.has(lesson.topic), `unknown topic ${lesson.topic} for ${lesson.id}`);
  assert.ok(lesson.title && lesson.summary && lesson.code, `incomplete lesson ${lesson.id}`);
  assert.ok(lesson.compare?.bad && lesson.compare?.good, `missing comparison ${lesson.id}`);
  assert.ok(Array.isArray(lesson.traps) && Array.isArray(lesson.tips), `missing teaching notes ${lesson.id}`);
  assert.ok(['worker','dom','node-model'].includes(lesson.runner), `invalid runner ${lesson.id}`);
  assert.ok(/^https:\/\/developer\.mozilla\.org\//.test(lesson.source) || /^https:\/\/nodejs\.org\//.test(lesson.source), `untrusted source ${lesson.id}: ${lesson.source}`);
  assert.equal(getLesson(lesson.id),lesson);
  if(lesson.debug){
    assert.ok(Array.isArray(lesson.debug.options) && lesson.debug.options.length>=4, `debug lesson needs multiple options: ${lesson.id}`);
    assert.ok(Number.isInteger(lesson.debug.answer) && lesson.debug.answer>=0 && lesson.debug.answer<lesson.debug.options.length, `bad debug answer: ${lesson.id}`);
    assert.ok(lesson.debug.question && lesson.debug.next && lesson.debug.root && lesson.debug.fix, `incomplete debug challenge: ${lesson.id}`);
  }
}
for(const topic of TOPICS) assert.ok(lessonsFor(topic.id).length>0, `empty topic ${topic.id}`);
assert.ok(LESSONS.some(x=>x.id==='closures'));
assert.ok(LESSONS.some(x=>x.id==='event-loop'));
assert.ok(LESSONS.some(x=>x.id==='dom-tree'));
assert.ok(LESSONS.some(x=>x.id==='node-event-loop'));
assert.ok(LESSONS.some(x=>x.id==='node-memory-usage'));
assert.ok(LESSONS.some(x=>x.id==='node-workers'));
assert.ok(LESSONS.filter(x=>x.topic==='debugging').length>=10,'expected advanced debugging section');
console.log(`Curriculum contracts passed: ${TOPICS.length} topics, ${LESSONS.length} lessons.`);