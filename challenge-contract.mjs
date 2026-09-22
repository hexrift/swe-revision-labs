import assert from 'node:assert/strict';
import { CHALLENGES } from './challenges.js';

assert.ok(CHALLENGES.length>=8,'the practice section should ship with a useful set of tasks');
assert.equal(new Set(CHALLENGES.map(challenge=>challenge.id)).size,CHALLENGES.length,'challenge IDs must be unique');
assert.equal(new Set(CHALLENGES.map(challenge=>challenge.prompt)).size,CHALLENGES.length,'challenge prompts must be unique');
assert.equal(new Set(CHALLENGES.map(challenge=>challenge.starter)).size,CHALLENGES.length,'challenge starters must be unique');
for(const challenge of CHALLENGES){
  assert.ok(challenge.id&&challenge.title&&challenge.topic&&challenge.prompt&&challenge.starter,'challenge metadata is complete');
  assert.ok(Number.isInteger(challenge.seconds)&&challenge.seconds>=60,'each challenge has a meaningful time limit');
  assert.ok(Array.isArray(challenge.expected)&&challenge.expected.length>0,'each challenge has expected output');
  assert.ok(challenge.hint&&challenge.source.startsWith('https://developer.mozilla.org/'),'each challenge has a source-backed hint');
}
console.log('Challenge contracts passed.');
