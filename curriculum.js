import { CORE_TOPICS, CORE_LESSONS } from './curriculum-core.js';
import { RUNTIME_TOPICS, RUNTIME_LESSONS } from './curriculum-runtime.js';
import { NODE_TOPICS, NODE_LESSONS } from './curriculum-node.js';
import { DEBUG_TOPIC, DEBUG_LESSONS } from './lessons-debugging.js';
import { LESSON_USE_CASES } from './lesson-use-cases.js';

export const TOPICS = [...CORE_TOPICS, ...RUNTIME_TOPICS, ...NODE_TOPICS, DEBUG_TOPIC];
const ALL_LESSONS = [...CORE_LESSONS, ...RUNTIME_LESSONS, ...NODE_LESSONS, ...DEBUG_LESSONS];
export const LESSONS = ALL_LESSONS.map(lesson => ({
  ...lesson,
  ...(LESSON_USE_CASES[lesson.id] ? { useWhen: LESSON_USE_CASES[lesson.id] } : {})
}));
export const getLesson = id => LESSONS.find(lesson => lesson.id === id);
export const getTopic = id => TOPICS.find(topic => topic.id === id);
export const lessonsFor = topic => LESSONS.filter(lesson => lesson.topic === topic);
export const sourceName = url => url.includes('nodejs.org') ? 'Node.js documentation' : 'MDN Web Docs';