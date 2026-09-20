import { PATTERNS } from './patterns.js';
import { renderCodeVisual } from './visual-models.js';

const esc = value => String(value);
const failures = [];

for (const pattern of PATTERNS) {
  if (pattern.category === 'architecture') continue;

  const base = { ...(pattern.inputs || {}) };
  const before = renderCodeVisual(pattern, base, 'normal', esc);

  const entries = Object.entries(base);
  let after;
  let mode;

  if (entries.length) {
    const [key, value] = entries[0];
    const changed = { ...base };
    if (typeof value === 'number') changed[key] = value === 0 ? 1 : value + Math.max(1, Math.ceil(Math.abs(value) * 0.25));
    else changed[key] = String(value) + '__changed';
    after = renderCodeVisual(pattern, changed, 'normal', esc);
    mode = 'input';
  } else {
    after = renderCodeVisual(pattern, base, 'edge', esc);
    mode = 'scenario';
  }

  if (!before || !after) {
    failures.push(`${pattern.id}: renderer returned empty output`);
    continue;
  }
  if (before === after) {
    failures.push(`${pattern.id}: ${mode} control does not change visualization`);
  }
}

if (failures.length) {
  console.error('Visualization contract failures:');
  failures.forEach(failure => console.error(' - ' + failure));
  process.exit(1);
}

console.log(`Visualization contracts passed for ${PATTERNS.filter(p => p.category !== 'architecture').length} code-pattern lessons.`);
