export const STATE_SCHEMA_VERSION = 2;

const LANGUAGES = new Set(['typescript','javascript','python']);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function pickPatternRecord(value, validIds, mapper) {
  const out = {};
  if (!isObject(value)) return out;
  for (const [id, entry] of Object.entries(value)) {
    if (!validIds.has(id)) continue;
    const mapped = mapper(entry, id);
    if (mapped !== undefined) out[id] = mapped;
  }
  return out;
}

export function createDefaultState(patterns = []) {
  const first = patterns[0] || null;
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    language: 'typescript',
    category: first?.category || 'fundamentals',
    current: first?.id || '',
    comfortable: {},
    inputs: {},
    scenarios: {},
    mastery: {},
    quiz: { current: 0, answers: {}, completed: false }
  };
}

export function normalizeState(raw, patterns = [], categories = [], quizLength = 0) {
  const defaults = createDefaultState(patterns);
  const source = isObject(raw) ? raw : {};
  const validIds = new Set(patterns.map(pattern => pattern.id));
  const validCategories = new Set(categories.map(category => category.id));

  const current = validIds.has(source.current) ? source.current : defaults.current;
  const currentPattern = patterns.find(pattern => pattern.id === current);
  const category = validCategories.has(source.category)
    ? source.category
    : (currentPattern?.category || defaults.category);

  const comfortable = pickPatternRecord(source.comfortable, validIds, value => !!value);
  const inputs = pickPatternRecord(source.inputs, validIds, value => isObject(value) ? { ...value } : undefined);
  const scenarios = pickPatternRecord(source.scenarios, validIds, value => value === 'edge' ? 'edge' : 'normal');
  const mastery = pickPatternRecord(source.mastery, validIds, value => {
    if (!Array.isArray(value)) return undefined;
    return Array.from({ length: 4 }, (_, index) => !!value[index]);
  });

  const rawQuiz = isObject(source.quiz) ? source.quiz : {};
  const maxQuestion = Math.max(0, quizLength - 1);
  const quizCurrent = Number.isInteger(rawQuiz.current)
    ? Math.max(0, Math.min(maxQuestion, rawQuiz.current))
    : 0;
  const answers = {};
  if (isObject(rawQuiz.answers)) {
    for (const [key, value] of Object.entries(rawQuiz.answers)) {
      const question = Number(key);
      if (!Number.isInteger(question) || question < 0 || question >= quizLength) continue;
      if (!Number.isInteger(value) || value < 0) continue;
      answers[question] = value;
    }
  }

  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    language: LANGUAGES.has(source.language) ? source.language : defaults.language,
    category,
    current,
    comfortable,
    inputs,
    scenarios,
    mastery,
    quiz: {
      current: quizCurrent,
      answers,
      completed: !!rawQuiz.completed && quizLength > 0
    }
  };
}

export function countComfortable(state, patterns = []) {
  return patterns.reduce((count, pattern) => count + (state.comfortable?.[pattern.id] ? 1 : 0), 0);
}

export function syncStateToRoute(state, route, getPattern) {
  if (!state || !route) return false;
  if (route.view !== 'pattern' || !route.id) return false;

  const pattern = getPattern(route.id);
  if (!pattern) return false;

  let changed = false;
  if (state.current !== pattern.id) {
    state.current = pattern.id;
    changed = true;
  }
  if (state.category !== pattern.category) {
    state.category = pattern.category;
    changed = true;
  }
  return changed;
}
