const MDN="https://developer.mozilla.org/en-US/docs/Web/JavaScript";

export const CHALLENGES=[
  {
    id:'format-user',
    title:'Format a user record',
    topic:'Functions and defaults',
    difficulty:'Warm-up',
    seconds:75,
    prompt:'Write formatUser so it returns “Name — role”. If role is missing, use “learner”. Log the result for the supplied user.',
    starter:`function formatUser(user) {
  // Return: Name — role
}

console.log(formatUser({ name: 'Mina' }));`,
    expected:['Mina — learner'],
    hint:'Destructure the object parameter and give role a default value.',
    source:MDN+'/Reference/Functions/Default_parameters'
  },
  {
    id:'active-names',
    title:'Select active names',
    topic:'Arrays and callbacks',
    difficulty:'Core',
    seconds:90,
    prompt:'Create activeNames from users by keeping active records and returning only their names. Log the names as one comma-separated line.',
    starter:`const users = [
  { name: 'Asha', active: true },
  { name: 'Bashir', active: false },
  { name: 'Mina', active: true }
];

const activeNames = [];
console.log(activeNames.join(', '));`,
    expected:['Asha, Mina'],
    hint:'The transformation has two steps: select records, then project their names.',
    source:MDN+'/Reference/Global_Objects/Array/filter'
  },
  {
    id:'counter-closure',
    title:'Build a counter closure',
    topic:'Closures',
    difficulty:'Core',
    seconds:120,
    prompt:'Implement makeCounter so each call returns the next number. Start at 3 and log three calls from the same counter.',
    starter:`function makeCounter(start) {
  // Keep the count private and return a function.
}

const counter = makeCounter(3);
console.log(counter(), counter(), counter());`,
    expected:['4 5 6'],
    hint:'The returned function must close over a binding that survives between calls.',
    source:MDN+'/JavaScript/Closures'
  },
  {
    id:'group-events',
    title:'Group events by type',
    topic:'Objects and reduce',
    difficulty:'Core',
    seconds:120,
    prompt:'Use reduce to group the events by type. Log the number of click events and the joined names of the users who caused them.',
    starter:`const events = [
  { type: 'click', user: 'Asha' },
  { type: 'view', user: 'Mina' },
  { type: 'click', user: 'Omar' }
];

const grouped = {};
console.log(grouped.click.length);
console.log(grouped.click.map(event => event.user).join(', '));`,
    expected:['2','Asha, Omar'],
    hint:'Start each missing group with an empty array, then push the current event.',
    source:MDN+'/Reference/Global_Objects/Array/reduce'
  },
  {
    id:'ordered-pipeline',
    title:'Preserve async order',
    topic:'Promises and async',
    difficulty:'Intermediate',
    seconds:105,
    prompt:'Complete boot so each asynchronous stage records its label in order. Log the final pipeline as “fetch → parse → render”.',
    starter:`async function boot() {
  const steps = [];
  // Record fetch, parse, and render in that order.
  console.log(steps.join(' → '));
}

await boot();`,
    expected:['fetch → parse → render'],
    hint:'Await each Promise before starting the next stage; the array is your observable trace.',
    source:MDN+'/JavaScript/Reference/Statements/async_function'
  },
  {
    id:'unique-tags',
    title:'Keep tags in first-seen order',
    topic:'Set and iteration',
    difficulty:'Intermediate',
    seconds:90,
    prompt:'Remove duplicate tags without changing their first-seen order. Log the result as one comma-separated line.',
    starter:`const tags = ['js', 'browser', 'js', 'node', 'browser'];

const uniqueTags = [];
console.log(uniqueTags.join(', '));`,
    expected:['js, browser, node'],
    hint:'Set removes duplicates while its iteration order follows insertion order.',
    source:MDN+'/Reference/Global_Objects/Set'
  },
  {
    id:'safe-divide',
    title:'Return a safe division result',
    topic:'Errors and validation',
    difficulty:'Intermediate',
    seconds:75,
    prompt:'Implement safeDivide. Return “OK: result” for valid input and “ERR: Cannot divide by zero” when the denominator is zero. Log both calls.',
    starter:`function safeDivide(left, right) {
  // Return a string beginning with OK: or ERR:
}

console.log(safeDivide(24, 3));
console.log(safeDivide(24, 0));`,
    expected:['OK: 8','ERR: Cannot divide by zero'],
    hint:'Validate the denominator before dividing; keep the function’s result easy to inspect.',
    source:MDN+'/JavaScript/Reference/Statements/try...catch'
  },
  {
    id:'memoized-square',
    title:'Memoize a calculation',
    topic:'Maps and state',
    difficulty:'Advanced',
    seconds:150,
    prompt:'Implement memoizeSquare so the first call calculates a square and later calls reuse the cached value. Log the result and the number of calculations.',
    starter:`function memoizeSquare() {
  let calculations = 0;
  // Return { square, getCalculations } using a private cache.
}

const square = memoizeSquare();
console.log(square.square(7));
console.log(square.square(7));
console.log(square.getCalculations());`,
    expected:['49','49','1'],
    hint:'A Map is useful for a private cache; count only when a value is not already cached.',
    source:MDN+'/Reference/Global_Objects/Map'
  }
];

export function getChallenge(id){return CHALLENGES.find(challenge=>challenge.id===id)}
