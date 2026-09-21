const question=(prompt,options,answer,explanation)=>({prompt,options,answer,explanation});

export const TOPIC_QUIZZES=[
  {topic:'foundations',title:'Language foundations quiz',questions:[
    question('What does an expression produce?',['A value','A browser tab','Only a side effect','A module'],0,'Expressions evaluate to values. Statements may control execution or perform actions, and some statements also contain expressions.'),
    question('Which declaration creates a block-scoped binding that cannot be rebound?',['var','const','function','object'],1,'const prevents rebinding of the variable. It does not make an object stored in that variable immutable.'),
    question('What does 0.1 + 0.2 === 0.3 evaluate to in JavaScript?',['true','A syntax error','false','It depends on strict mode'],2,'Number uses binary floating-point representation, so the calculated value is not exactly the same as the decimal literal 0.3.')
  ]},
  {topic:'control',title:'Control flow & iteration quiz',questions:[
    question('What happens when an if condition is false and an else branch exists?',['The else branch runs','Both branches run','The program always throws','The condition is retried'],0,'The else branch is the alternative path when the if condition is falsy.'),
    question('What is finally intended to do?',['Run only after success','Run only after an error','Run cleanup whether execution succeeds or throws','Prevent all errors'],2,'finally runs after the try/catch path, making it useful for cleanup.'),
    question('What does for...of iterate over?',['Property names','Iterable values','Only object prototypes','Function parameters'],1,'for...of consumes an iterable and yields its values. for...in enumerates property keys.')
  ]},
  {topic:'functions',title:'Functions, scope & closures quiz',questions:[
    question('What does a closure retain?',['Only the function name','Access to its lexical environment','A copy of the entire program','The call stack forever'],1,'A closure keeps access to bindings from the lexical scope where the function was created.'),
    question('How does an arrow function obtain this?',['From its lexical surrounding scope','From the object before the dot','Always from globalThis','From bind automatically'],0,'Arrow functions do not create their own this; they capture it from the surrounding scope.'),
    question('What must a recursive function have to terminate?',['A global variable','A base case toward which calls converge','A promise','A class declaration'],1,'Without a converging base case, recursive calls continue until the stack or another limit is exhausted.')
  ]},
  {topic:'objects',title:'Objects, prototypes & classes quiz',questions:[
    question('Where does JavaScript look after an object lacks an own property?',['Only in globalThis','Along its prototype chain','In the source file name','Nowhere'],1,'Property lookup continues through the object’s prototype chain until a property is found or the chain ends.'),
    question('Where can a private class field such as #count be accessed?',['Anywhere with the object reference','Only inside the declaring class body','Only in a subclass','Only in JSON'],1,'Private fields are enforced by the language and can only be accessed from the class that declares them.'),
    question('How is a getter normally read?',['As a function call with get()','Like a property','Only through Reflect','Only during construction'],1,'A getter is invoked by property access, so callers use object.value rather than object.value().')
  ]},
  {topic:'collections',title:'Collections & built-ins quiz',questions:[
    question('What does map normally return?',['A transformed array with one result per input element','Only the first matching element','A Set of keys','A boolean'],0,'map transforms each element and returns a new array with the corresponding results.'),
    question('What is a key capability of Map?',['Only string keys','Object keys can retain identity','It cannot be iterated','It automatically serializes to JSON'],1,'Map supports keys of any value type, including objects, with identity-based lookup.'),
    question('Why is WeakMap intentionally limited compared with Map?',['It cannot store objects','Its keys are weakly held and it is not enumerable','It only stores numbers','It is synchronous'],1,'WeakMap supports garbage-collection-friendly associations, so the collection cannot expose a complete enumerable key list.')
  ]},
  {topic:'iteration',title:'Iterators & generators quiz',questions:[
    question('What does an iterator next() call return?',['A promise only','An object containing value and done','A property descriptor','A DOM node'],1,'The iterator protocol uses objects such as { value, done } to report progress.'),
    question('What does yield do inside a generator?',['Stops the program permanently','Pauses the generator and exposes a value','Creates a new thread','Converts values to strings'],1,'yield suspends the generator until its next() method is called again.'),
    question('Why can lazy iteration save work?',['It computes every value earlier','It computes values only as they are requested','It disables garbage collection','It removes all loops'],1,'Generators and other lazy iterables defer computation until a consumer asks for the next value.')
  ]},
  {topic:'async',title:'Promises & execution model quiz',questions:[
    question('What does await pause?',['The entire JavaScript thread','The current async function until its promise settles','All browser rendering','Every worker'],1,'await suspends the current async function while the host can continue processing other work.'),
    question('When are promise reactions generally processed?',['As microtasks after the current job','Before the current synchronous line','Only after a new page load','Inside the call stack immediately'],0,'Promise reactions are queued as microtasks and run after the current job completes before the next task.'),
    question('What does Promise.all do when one input promise rejects?',['It waits forever','It rejects the combined promise','It converts the error to undefined','It retries the promise'],1,'Promise.all fulfils when all inputs fulfil and rejects when an input rejects.')
  ]},
  {topic:'modules',title:'Modules & resources quiz',questions:[
    question('What is the main difference between named and default exports?',['A module can have many named exports but one default export','Default exports cannot be imported','Named exports only work in Node.js','They are identical syntax'],0,'Named exports are imported by name; a module may expose multiple of them, while it has at most one default export.'),
    question('What does it mean that module exports are live bindings?',['Imports are copied once','An imported binding can reflect updates from its exporting module','Imports are mutable by any caller','Modules run on every property read'],1,'The binding remains connected to the exporting module rather than becoming an independent copied value.'),
    question('What does dynamic import() return?',['A module namespace promise','A synchronous object','A file descriptor','A generator'],0,'dynamic import() loads asynchronously and returns a promise for the module namespace object.')
  ]},
  {topic:'advanced',title:'Memory & metaprogramming quiz',questions:[
    question('What is a TypedArray?',['A view over binary data','A DOM collection','A promise queue','A class decorator'],0,'TypedArray objects provide typed views over an ArrayBuffer’s binary memory.'),
    question('What primarily determines whether an object can be garbage-collected?',['Whether it is reachable','Whether it is large','Whether it is inside an array','Whether it has a class'],0,'Garbage collection can reclaim objects that are no longer reachable from live roots.'),
    question('What can a Proxy intercept?',['Selected object operations such as get and set','Only network requests','Only garbage collection','Only syntax parsing'],0,'Proxy traps can customise operations such as property access, assignment, calls and construction.')
  ]},
  {topic:'browser',title:'JavaScript in the browser quiz',questions:[
    question('Why can DOM changes become expensive?',['They may trigger style calculation and layout','They always start a new process','They disable JavaScript','They only affect storage'],0,'DOM work can cause the browser to recalculate styles, layout and paint, especially when reads and writes are interleaved.'),
    question('When is requestAnimationFrame intended to run?',['Before a browser repaint','Only after a network response','During garbage collection','At a fixed one-second interval'],0,'requestAnimationFrame schedules visual work in coordination with the browser’s rendering cycle.'),
    question('What is a key limitation of a Web Worker?',['It cannot directly access the page DOM','It cannot run JavaScript','It cannot communicate','It must block the main thread'],0,'Workers run JavaScript away from the page’s main thread but communicate through messaging and do not directly manipulate the DOM.')
  ]},
  {topic:'node',title:'Node.js runtime & OS resources quiz',questions:[
    question('What does process.memoryUsage().rss represent?',['Resident memory held by the process','Only V8 old-space','Only file descriptors','The event-loop queue length'],0,'RSS is resident set size for the process and includes more than the V8 JavaScript heap.'),
    question('What does stream backpressure protect against?',['A producer overwhelming a slower consumer','Syntax errors in imports','Prototype mutation','Garbage collection entirely'],0,'Backpressure lets a producer slow down when the consumer or downstream buffer cannot keep up.'),
    question('Why can synchronous filesystem work be harmful in a server?',['It blocks the event loop while the operation runs','It always corrupts files','It creates a worker automatically','It only affects logs'],0,'Synchronous work prevents the event loop from servicing other callbacks during the operation.')
  ]},
  {topic:'debugging',title:'Advanced debugging quiz',questions:[
    question('What is the usual next step after fetch resolves?',['Call response.json() to parse the body','Assume the body is already an object','Restart the process','Use JSON.parse(response)'],0,'fetch resolves to a Response. Parsing the body is a separate asynchronous step.'),
    question('Why can a var loop callback see the final index?',['All callbacks share one function-scoped binding','Promises always reorder variables','let is global','The timer changes the source code'],0,'var creates one function-scoped binding for the loop, so callbacks created in the loop can observe its later value.'),
    question('What happens when a stream producer outruns its consumer?',['Buffered data can grow and increase memory pressure','The consumer automatically speeds up','The event loop stops forever','The data becomes a DOM node'],0,'Without effective backpressure, queued chunks can grow faster than they are consumed.')
  ]}
];

export const getTopicQuiz=id=>TOPIC_QUIZZES.find(quiz=>quiz.topic===id);
