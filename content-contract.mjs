import { CATEGORIES, PATTERNS, SOURCES } from './patterns.js';

const failures = [];
const ids = new Set();

for (const pattern of PATTERNS) {
  if (!pattern.id) failures.push('pattern missing id');
  if (ids.has(pattern.id)) failures.push(`duplicate pattern id: ${pattern.id}`);
  ids.add(pattern.id);

  if (!pattern.title?.trim()) failures.push(`${pattern.id}: missing title`);
  if (!pattern.note?.trim()) failures.push(`${pattern.id}: missing explanation/note`);
  if (!pattern.source) failures.push(`${pattern.id}: missing source key`);
  else if (!SOURCES[pattern.source]) failures.push(`${pattern.id}: unknown source key "${pattern.source}"`);

  const source = SOURCES[pattern.source];
  if (source && (!source.url?.startsWith('https://') || !source.label?.trim())) {
    failures.push(`${pattern.id}: source must have HTTPS URL and label`);
  }

  if (!pattern.code?.javascript?.bad || !pattern.code?.javascript?.good) {
    failures.push(`${pattern.id}: missing poor/better example`);
  }
}

for (const category of CATEGORIES) {
  const count = PATTERNS.filter(pattern => pattern.category === category.id).length;
  if (!count) failures.push(`category ${category.id}: has no lessons`);
}

if (failures.length) {
  console.error('Content contract failures:');
  failures.forEach(failure => console.error(' - ' + failure));
  process.exit(1);
}

console.log(`Content contracts passed: ${PATTERNS.length} sourced lessons across ${CATEGORIES.length} topics.`);
