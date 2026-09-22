import assert from 'node:assert/strict';
import { TOPICS, LESSONS, getLesson, lessonsFor } from './curriculum.js';
import { TOPIC_QUIZZES } from './quizzes.js';
import { LESSON_USE_CASES } from './lesson-use-cases.js';

assert.ok(TOPICS.length >= 10, 'expected comprehensive topic index');
assert.ok(LESSONS.length >= 100, 'expected comprehensive lesson library');

const topicIds=new Set(TOPICS.map(x=>x.id));
const lessonIds=new Set();
assert.equal(Object.keys(LESSON_USE_CASES).length,LESSONS.length,'every current subtopic should have a use-case note');
for(const lesson of LESSONS){
  assert.equal(lesson.useWhen,LESSON_USE_CASES[lesson.id],`missing use-case note ${lesson.id}`);
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
assert.equal(TOPIC_QUIZZES.length,TOPICS.length,'every topic needs one end-of-topic quiz');
for(const topic of TOPICS){
  const quiz=TOPIC_QUIZZES.find(item=>item.topic===topic.id);
  assert.ok(quiz,`missing quiz for ${topic.id}`);
  assert.ok(quiz.title && quiz.questions.length>=3,`incomplete quiz for ${topic.id}`);
  for(const item of quiz.questions){
    assert.ok(item.prompt && item.options.length>=4,`incomplete quiz question in ${topic.id}`);
    assert.ok(Number.isInteger(item.answer)&&item.answer>=0&&item.answer<item.options.length,`bad quiz answer in ${topic.id}`);
    assert.ok(item.explanation,`missing quiz explanation in ${topic.id}`);
  }
}
assert.ok(LESSONS.some(x=>x.id==='closures'));
assert.ok(LESSONS.some(x=>x.id==='event-loop'));
assert.ok(LESSONS.some(x=>x.id==='dom-tree'));
assert.ok(LESSONS.some(x=>x.id==='node-event-loop'));
assert.ok(LESSONS.some(x=>x.id==='node-memory-usage'));
assert.ok(LESSONS.some(x=>x.id==='node-workers'));
assert.ok(LESSONS.filter(x=>x.topic==='debugging').length>=10,'expected advanced debugging section');
const rafLesson=LESSONS.find(x=>x.id==='request-animation-frame');
assert.match(rafLesson.code,/await new Promise/,'rAF example must await its final frame so the runner measures the full animation');
console.log(`Curriculum contracts passed: ${TOPICS.length} topics, ${LESSONS.length} lessons.`);
