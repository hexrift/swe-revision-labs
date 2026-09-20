import { ARCHITECTURE_SOURCES, ARCHITECTURE_PATTERNS } from './architecture.js';
import { INTERVIEW_SOURCES, INTERVIEW_CATEGORIES, INTERVIEW_PATTERNS } from './interview-curriculum.js';

export const SOURCES = { ...ARCHITECTURE_SOURCES, ...INTERVIEW_SOURCES,
  mdnStyle: { label: 'MDN · JavaScript code style', url: 'https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Code_style_guide/JavaScript' },
  mdnClasses: { label: 'MDN · Using classes', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_classes' },
  mdnVars: { label: 'MDN · Variables', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Variables' },
  pep8: { label: 'PEP 8 · Style Guide for Python', url: 'https://peps.python.org/pep-0008/' },
  pythonData: { label: 'Python docs · Data structures', url: 'https://docs.python.org/3/tutorial/datastructures.html' },
  pythonCollections: { label: 'Python docs · collections', url: 'https://docs.python.org/3/library/collections.html' },
  tsHandbook: { label: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/' },
  nodeLoop: { label: 'Node.js · Don’t block the event loop', url: 'https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop' },
  owaspValidation: { label: 'OWASP · Input Validation', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html' },
  owaspSql: { label: 'OWASP · SQL Injection Prevention', url: 'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html' },
  owaspSsrf: { label: 'OWASP · SSRF Prevention', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html' },
  owaspAuthz: { label: 'OWASP · Authorization', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html' },
  http: { label: 'IETF RFC 9110 · HTTP Semantics', url: 'https://www.rfc-editor.org/rfc/rfc9110' },
  websocket: { label: 'IETF RFC 6455 · WebSocket', url: 'https://www.rfc-editor.org/rfc/rfc6455' },
  mcp: { label: 'Model Context Protocol · Specification', url: 'https://modelcontextprotocol.io/specification/' },
  mcpAuth: { label: 'MCP Apps · Authorization', url: 'https://apps.extensions.modelcontextprotocol.io/api/documents/authorization.html' }
};

const BASE_CATEGORIES = [
  { id:'fundamentals', title:'Variables & values', icon:'01', description:'Names, mutation, types, defaults and boundaries.' },
  { id:'functions', title:'Functions', icon:'02', description:'Purity, parameters, errors, recursion and async work.' },
  { id:'classes', title:'Classes & objects', icon:'03', description:'State, encapsulation, composition and API design.' },
  { id:'collections', title:'Collections & complexity', icon:'04', description:'Arrays, sets, maps, queues, copying and lookup costs.' },
  { id:'web', title:'Async, HTTP & protocols', icon:'05', description:'Event loops, retries, idempotency, streams and sockets.' },
  { id:'security', title:'Secure coding', icon:'06', description:'Validation, injection, authz, SSRF and dangerous APIs.' },
  { id:'ai', title:'AI & MCP', icon:'07', description:'Tool boundaries, RAG, prompt injection and model authority.' },
  { id:'architecture', title:'Architecture & compute', icon:'08', description:'Monoliths, microservices, events, queues, compute models and platform trade-offs.' }
];

const P = (id, category, title, source, viz, badJs, goodJs, badPy, goodPy, note, inputs={}) => ({
  id, category, title, source, viz, code: {
    javascript:{bad:badJs,good:goodJs},
    typescript:{bad:badJs,good:goodJs},
    python:{bad:badPy,good:goodPy}
  }, note, inputs
});

const BASE_PATTERNS = [
  // VARIABLES & VALUES
  P('const-first','fundamentals','Prefer stable bindings','mdnStyle','binding',
`let taxRate = 0.2;
let total = price * (1 + taxRate);`,
`const taxRate = 0.2;
const total = price * (1 + taxRate);`,
`tax_rate = 0.2
total = price * (1 + tax_rate)`,
`TAX_RATE = 0.2
total = price * (1 + TAX_RATE)`,
'Use the narrowest mutation surface. A stable name reduces the number of states a reader must consider.',{price:100}),
  P('avoid-var','fundamentals','Avoid function-scoped var','mdnVars','scope',
`for (var i = 0; i < 3; i++) {}
console.log(i); // 3`,
`for (let i = 0; i < 3; i++) {}
// i is not visible here`,
`i = 99
for i in range(3):
    pass
print(i)  # leaked/reused name`,
`for index in range(3):
    pass
# avoid reusing index outside the loop`,
'Keep names inside the smallest useful scope. Scope leakage creates surprising coupling.',{iterations:3}),
  P('meaningful-names','fundamentals','Name the concept, not the type','pep8','flow',
`const arr = users.filter(u => u.a);`,
`const activeUsers = users.filter(user => user.isActive);`,
`x = [u for u in users if u.a]`,
`active_users = [user for user in users if user.is_active]`,
'Names are executable documentation. Prefer domain meaning over abbreviations and container types.'),
  P('boolean-names','fundamentals','Make booleans read like questions','pep8','flow',
`const disabled = !user.enabled;
if (!disabled) start();`,
`const isEnabled = user.enabled;
if (isEnabled) start();`,
`disabled = not user.enabled
if not disabled:
    start()`,
`is_enabled = user.enabled
if is_enabled:
    start()`,
'Positive boolean names reduce double-negation and make conditionals easier to scan.'),
  P('magic-numbers','fundamentals','Name important constants','pep8','binding',
`if (retries > 3) fail();
setTimeout(run, 30000);`,
`const MAX_RETRIES = 3;
const RETRY_WINDOW_MS = 30_000;`,
`if retries > 3:
    fail()
sleep(30)`,
`MAX_RETRIES = 3
RETRY_WINDOW_SECONDS = 30`,
'Named constants expose intent, units and policy. The value is less important than what the value means.',{value:3}),
  P('ts-unknown','fundamentals','Prefer unknown at untrusted boundaries','tsHandbook','boundary',
`function parse(input: any) {
  return input.user.name.toUpperCase();
}`,
`function parse(input: unknown) {
  if (!isUserPayload(input)) throw new Error('invalid');
  return input.user.name.toUpperCase();
}`,
`def parse(data):
    return data["user"]["name"].upper()`,
`def parse(data: object):
    payload = validate_user_payload(data)
    return payload.user.name.upper()`,
'Boundary data is not trustworthy because a type annotation says so. Narrow or validate before use.'),
  P('mutable-default','fundamentals','Do not share mutable defaults','pythonData','state',
`const sharedBucket = [];
function add(item, bucket = sharedBucket) {
  bucket.push(item);
  return bucket;
}`,
`function add(item, bucket) {
  const out = bucket ? [...bucket] : [];
  out.push(item);
  return out;
}`,
`def add(item, bucket=[]):
    bucket.append(item)
    return bucket`,
`def add(item, bucket=None):
    bucket = [] if bucket is None else bucket
    bucket.append(item)
    return bucket`,
'Python evaluates mutable default arguments once at function definition. In JavaScript, a default array literal is fresh per call; the poor JS example therefore uses an explicitly shared default to demonstrate the same ownership bug.',{calls:3}),
  P('copy-boundary','fundamentals','Be deliberate about mutation','tsHandbook','state',
`function applyDiscount(order) {
  order.total *= 0.9;
  return order;
}`,
`function applyDiscount(order) {
  return { ...order, total: order.total * 0.9 };
}`,
`def apply_discount(order):
    order["total"] *= .9
    return order`,
`def apply_discount(order):
    return {**order, "total": order["total"] * .9}`,
'Mutation can be correct, but crossing a function boundary with hidden mutation makes aliasing harder to reason about.',{total:100}),

  // FUNCTIONS
  P('guard-clauses','functions','Use guard clauses to reduce nesting','pep8','flow',
`function ship(order) {
  if (order) {
    if (order.paid) {
      if (!order.cancelled) return dispatch(order);
    }
  }
  return null;
}`,
`function ship(order) {
  if (!order) return null;
  if (!order.paid) return null;
  if (order.cancelled) return null;
  return dispatch(order);
}`,
`def ship(order):
    if order:
        if order.paid:
            if not order.cancelled:
                return dispatch(order)
    return None`,
`def ship(order):
    if not order: return None
    if not order.paid: return None
    if order.cancelled: return None
    return dispatch(order)`,
'Guard clauses keep the happy path visible and reduce indentation depth.'),
  P('pure-functions','functions','Separate calculation from effects','pep8','state',
`let subtotal = 0;
function addPrice(price) {
  subtotal += price;
}`,
`function addPrice(subtotal, price) {
  return subtotal + price;
}`,
`subtotal = 0
def add_price(price):
    global subtotal
    subtotal += price`,
`def add_price(subtotal, price):
    return subtotal + price`,
'Pure calculations are easier to test, cache and reason about because output depends only on explicit input.',{subtotal:20,price:5}),
  P('flag-argument','functions','Avoid mode-switch boolean parameters','pep8','flow',
`function save(user, notify) {
  persist(user);
  if (notify) sendEmail(user);
}`,
`function save(user) { persist(user); }
function saveAndNotify(user) {
  save(user); sendEmail(user);
}`,
`def save(user, notify):
    persist(user)
    if notify:
        send_email(user)`,
`def save(user):
    persist(user)

def save_and_notify(user):
    save(user)
    send_email(user)`,
'A boolean flag often means one function has two responsibilities and two behavioral contracts.'),
  P('parameter-object','functions','Group related parameters','tsHandbook','flow',
`createUser(name, email, role, locale, timezone, marketing);`,
`createUser({
  name, email, role,
  locale, timezone, marketing
});`,
`create_user(name, email, role, locale, timezone, marketing)`,
`create_user(UserOptions(
    name=name, email=email, role=role,
    locale=locale, timezone=timezone,
    marketing=marketing,
))`,
'Parameter objects make call sites self-documenting and make evolution less positional.'),
  P('error-context','functions','Preserve error context','pep8','flow',
`try {
  await loadConfig();
} catch {
  throw new Error('failed');
}`,
`try {
  await loadConfig();
} catch (cause) {
  throw new Error('config load failed', { cause });
}`,
`try:
    load_config()
except Exception:
    raise RuntimeError("failed")`,
`try:
    load_config()
except Exception as exc:
    raise RuntimeError("config load failed") from exc`,
'Wrap errors only when you add useful context, and preserve the original cause.'),
  P('memoization','functions','Do not recompute overlapping subproblems','pythonData','recursion',
`function fib(n) {
  if (n < 2) return n;
  return fib(n-1) + fib(n-2);
}`,
`const memo = new Map();
function fib(n) {
  if (n < 2) return n;
  if (memo.has(n)) return memo.get(n);
  const value = fib(n-1) + fib(n-2);
  memo.set(n, value);
  return value;
}`,
`def fib(n):
    if n < 2: return n
    return fib(n-1) + fib(n-2)`,
`from functools import cache

@cache
def fib(n):
    if n < 2: return n
    return fib(n-1) + fib(n-2)`,
'Memoization trades space for time by remembering solved states.',{n:12}),
  P('serial-await','functions','Do independent I/O concurrently','nodeLoop','timeline',
`const a = await loadA();
const b = await loadB();
const c = await loadC();`,
`const [a, b, c] = await Promise.all([
  loadA(), loadB(), loadC()
]);`,
`a = await load_a()
b = await load_b()
c = await load_c()`,
`a, b, c = await asyncio.gather(
    load_a(), load_b(), load_c()
)`,
'Independent I/O does not need to wait in a serial chain. Concurrency improves wall-clock latency, not algorithmic work.',{taskMs:100}),
  P('bounded-work','functions','Bound concurrency','nodeLoop','timeline',
`await Promise.all(items.map(send));`,
`await mapLimit(items, 8, send);`,
`await asyncio.gather(*(send(x) for x in items))`,
`sem = asyncio.Semaphore(8)
async def one(x):
    async with sem:
        return await send(x)
await asyncio.gather(*(one(x) for x in items))`,
'Concurrency is a resource budget. Bound it to protect memory, sockets and downstream services.',{items:40,limit:8}),

  // CLASSES
  P('encapsulation','classes','Hide representation behind behavior','mdnClasses','object',
`class Account {
  balance = 0;
}
account.balance = -500;`,
`class Account {
  #balance = 0;
  debit(amount) {
    if (amount > this.#balance) throw new Error('funds');
    this.#balance -= amount;
  }
}`,
`class Account:
    def __init__(self):
        self.balance = 0

account.balance = -500`,
`class Account:
    def __init__(self):
        self._balance = 0
    def debit(self, amount):
        if amount > self._balance:
            raise ValueError("funds")
        self._balance -= amount`,
'Objects are useful when they protect invariants, not merely when they bundle fields.'),
  P('god-class','classes','Split unrelated responsibilities','mdnClasses','object',
`class UserService {
  save() {}
  sendEmail() {}
  renderAvatar() {}
  calculateTax() {}
}`,
`class UserRepository {}
class Mailer {}
class AvatarRenderer {}
class TaxPolicy {}`,
`class UserService:
    def save(self): ...
    def send_email(self): ...
    def render_avatar(self): ...
    def calculate_tax(self): ...`,
`class UserRepository: ...
class Mailer: ...
class AvatarRenderer: ...
class TaxPolicy: ...`,
'High cohesion means a module changes for closely related reasons.'),
  P('composition','classes','Prefer composition for independent capabilities','mdnClasses','object',
`class Report extends EmailingDatabaseBackedThing {}`,
`class ReportService {
  constructor(repo, mailer) {
    this.repo = repo;
    this.mailer = mailer;
  }
}`,
`class Report(EmailingDatabaseBackedThing):
    pass`,
`class ReportService:
    def __init__(self, repo, mailer):
        self.repo = repo
        self.mailer = mailer`,
'Inheritance is strongest for true substitutable relationships. Composition keeps capabilities replaceable.'),
  P('readonly','classes','Make immutable intent visible','tsHandbook','object',
`interface Config {
  host: string;
}
config.host = 'other';`,
`interface Config {
  readonly host: string;
}
const config: Readonly<Config> = loadConfig();`,
`config = {"host": "api"}
config["host"] = "other"`,
`from dataclasses import dataclass

@dataclass(frozen=True)
class Config:
    host: str`,
'Readonly/frozen data shrinks the state space and communicates ownership.'),
  P('expensive-property','classes','Do not hide expensive work behind property syntax','pep8','object',
`class User {
  get profile() {
    return db.loadProfile(this.id);
  }
}`,
`class User {
  async loadProfile() {
    return db.loadProfile(this.id);
  }
}`,
`class User:
    @property
    def profile(self):
        return db.load_profile(self.id)`,
`class User:
    async def load_profile(self):
        return await db.load_profile(self.id)`,
'Property/attribute syntax suggests cheap local access. Expensive I/O should look like an operation.'),
  P('factory-validation','classes','Construct only valid objects','tsHandbook','boundary',
`const user = new User(raw.email, raw.age);`,
`const user = User.fromPayload(validateUser(raw));`,
`user = User(data["email"], data["age"])`,
`user = User.from_payload(validate_user(data))`,
'Factories are useful when construction needs parsing, defaults or invariant checks.'),
  P('dependency-boundary','classes','Inject dependencies instead of reaching for globals','mdnClasses','object',
`class InvoiceService {
  send(invoice) {
    return globalMailer.send(invoice);
  }
}`,
`class InvoiceService {
  constructor(mailer) {
    this.mailer = mailer;
  }
}`,
`class InvoiceService:
    def send(self, invoice):
        return global_mailer.send(invoice)`,
`class InvoiceService:
    def __init__(self, mailer):
        self.mailer = mailer`,
'Explicit dependencies make behavior easier to test and make coupling visible.'),
  P('data-vs-behavior','classes','Do not force every record into a class','pythonData','object',
`class Point {
  constructor(x, y) {
    this.x = x; this.y = y;
  }
}`,
`const point = { x, y };
// use a class only if invariants/behavior justify it`,
`class Point:
    def __init__(self, x, y):
        self.x = x; self.y = y`,
`from dataclasses import dataclass

@dataclass(frozen=True)
class Point:
    x: float
    y: float`,
'Use the simplest representation that protects the required invariants and behavior.'),

  // COLLECTIONS
  P('membership-set','collections','Index repeated membership checks','pythonData','cost',
`const common = a.filter(x => b.includes(x));`,
`const bSet = new Set(b);
const common = a.filter(x => bSet.has(x));`,
`common = [x for x in a if x in b]`,
`b_set = set(b)
common = [x for x in a if x in b_set]`,
'Repeated linear scans multiply. Build an index once when you perform many lookups.',{n:100,m:100}),
  P('queue-front','collections','Use a queue structure for front removal','pythonCollections','cost',
`while (queue.length) {
  process(queue.shift());
}`,
`let head = 0;
while (head < queue.length) {
  process(queue[head++]);
}`,
`while queue:
    process(queue.pop(0))`,
`from collections import deque
queue = deque(queue)
while queue:
    process(queue.popleft())`,
'Removing from the front of a contiguous array/list repeatedly shifts remaining elements.',{n:100}),
  P('repeated-copy','collections','Do not rebuild a growing array in a loop','pythonData','allocation',
`let out = [];
for (const x of items) {
  out = [...out, transform(x)];
}`,
`const out = [];
for (const x of items) {
  out.push(transform(x));
}`,
`out = []
for x in items:
    out = out + [transform(x)]`,
`out = []
for x in items:
    out.append(transform(x))`,
'Repeated copying turns simple accumulation into quadratic copying and allocation pressure.',{n:100}),
  P('sort-once','collections','Do not sort repeatedly for each lookup','pythonData','cost',
`for (const q of queries) {
  values.sort((a,b)=>a-b);
  answer(q, values);
}`,
`const sorted = [...values].sort((a,b)=>a-b);
for (const q of queries) answer(q, sorted);`,
`for q in queries:
    values.sort()
    answer(q, values)`,
`sorted_values = sorted(values)
for q in queries:
    answer(q, sorted_values)`,
'Move invariant work out of repeated paths.',{n:100,queries:20}),
  P('streaming-generator','collections','Stream large results when full materialization is unnecessary','pythonData','allocation',
`const rows = await loadAllRows();
return rows.map(format);`,
`for await (const row of streamRows()) {
  yield format(row);
}`,
`rows = list(load_all_rows())
return [format_row(r) for r in rows]`,
`def formatted_rows():
    for row in stream_rows():
        yield format_row(row)`,
'Streaming trades random access for lower peak memory and earlier first output.',{n:1000}),
  P('n-plus-one','collections','Count remote round trips','pythonData','network',
`const users = await db.users();
for (const user of users) {
  user.team = await db.team(user.teamId);
}`,
`const users = await db.users();
const teams = await db.teams(uniqueTeamIds(users));
joinLocally(users, teams);`,
`users = db.users()
for user in users:
    user.team = db.team(user.team_id)`,
`users = db.users()
teams = db.teams({u.team_id for u in users})
join_locally(users, teams)`,
'Remote round trips are a complexity dimension. N+1 often dominates in-memory algorithmic costs.',{n:50,latency:20}),
  P('map-for-keyed','collections','Use keyed structures for keyed access','pythonData','cost',
`function findUser(id) {
  return users.find(u => u.id === id);
}`,
`const byId = new Map(users.map(u => [u.id, u]));
const user = byId.get(id);`,
`def find_user(user_id):
    return next(u for u in users if u.id == user_id)`,
`by_id = {u.id: u for u in users}
user = by_id.get(user_id)`,
'If access is primarily by key and repeated, represent the collection by key.',{n:1000,lookups:100}),
  P('dedupe-set','collections','Use a set for uniqueness','pythonData','cost',
`const unique = [];
for (const x of values) {
  if (!unique.includes(x)) unique.push(x);
}`,
`const unique = [...new Set(values)];`,
`unique = []
for x in values:
    if x not in unique:
        unique.append(x)`,
`unique = list(dict.fromkeys(values))`,
'Uniqueness is a set-like property. Repeated scans are usually the wrong primitive.',{n:200}),

  // ASYNC / WEB / PROTOCOLS
  P('event-loop-block','web','Do not block the event loop','nodeLoop','timeline',
`app.get('/report', (req, res) => {
  const data = fs.readFileSync('huge.json');
  res.send(buildReport(data));
});`,
`app.get('/report', async (req, res) => {
  const data = await fs.promises.readFile('huge.json');
  res.send(await buildReportAsync(data));
});`,
`def handler(request):
    data = open("huge.json").read()
    return build_report(data)`,
`async def handler(request):
    data = await read_file_async("huge.json")
    return await build_report_async(data)`,
'Blocking work delays unrelated requests on the same execution resource.',{taskMs:300}),
  P('retry-jitter','web','Back off retries and add jitter','nodeLoop','protocol',
`while (true) {
  try { return await call(); }
  catch {}
}`,
`for (let attempt=0; attempt<4; attempt++) {
  try { return await call(); }
  catch (e) {
    if (!isTransient(e) || attempt===3) throw e;
    await sleep(jitter(100 * 2 ** attempt));
  }
}`,
`while True:
    try: return await call()
    except Exception: pass`,
`for attempt in range(4):
    try:
        return await call()
    except TransientError:
        if attempt == 3: raise
        await sleep(jitter(.1 * 2**attempt))`,
'Immediate infinite retries synchronize clients and amplify outages.',{failures:3}),
  P('timeout','web','Bound remote waits with timeouts','nodeLoop','protocol',
`const result = await fetch(url);`,
`const result = await fetch(url, {
  signal: AbortSignal.timeout(1500)
});`,
`result = await http.get(url)`,
`result = await asyncio.wait_for(http.get(url), timeout=1.5)`,
'Every remote dependency can stall. A timeout converts an unbounded wait into a policy decision.',{timeout:1500}),
  P('idempotency-key','web','Make retryable side effects idempotent','http','protocol',
`POST /charge
{ "amount": 100 }`,
`POST /charge
Idempotency-Key: 8b8...
{ "amount": 100 }`,
`await charge(amount=100)`,
`await charge(amount=100, idempotency_key=request_id)`,
'A timeout can leave the caller unsure whether the first attempt succeeded. Stable operation identity makes safe retries possible.',{retries:2}),
  P('safe-http-method','web','Respect HTTP method semantics','http','protocol',
`GET /users/42/delete`,
`DELETE /users/42`,
`@app.get("/users/{id}/delete")
def delete(id): ...`,
`@app.delete("/users/{id}")
def delete(id): ...`,
'Browsers, crawlers, caches and retrying infrastructure rely on method semantics.'),
  P('polling-vs-sse','web','Use a stream for one-way live updates','http','protocol',
`setInterval(async () => {
  const status = await fetch('/status');
}, 1000);`,
`const events = new EventSource('/status-stream');
events.onmessage = handleStatus;`,
`while True:
    status = await get_status()
    await sleep(1)`,
`async for event in status_stream():
    handle_status(event)`,
'Polling repeatedly pays request overhead even when nothing changes. SSE can be simpler for server-to-client updates.'),
  P('websocket-backpressure','web','Design WebSocket backpressure','websocket','protocol',
`socket.on('message', msg => process(msg));`,
`socket.on('message', msg => {
  if (queue.size >= MAX_QUEUE) return shed(msg);
  queue.push(msg);
});`,
`async for msg in socket:
    await process(msg)`,
`async for msg in socket:
    if queue.full():
        await shed(msg)
    else:
        await queue.put(msg)`,
'Persistent connections remove request boundaries, so you must create explicit flow control and queue limits.',{messages:100,capacity:20}),
  P('pagination','web','Bound collection responses','http','protocol',
`GET /events
// returns every event`,
`GET /events?limit=50&cursor=abc`,
`events = await db.all_events()`,
`events = await db.events(limit=50, cursor=cursor)`,
'Pagination protects memory, response size and database work while giving callers an explicit traversal contract.',{rows:5000,page:50}),

  // SECURITY
  P('sql-params','security','Parameterize SQL','owaspSql','boundary',
`const sql = "SELECT * FROM users WHERE email='" + email + "'";
db.query(sql);`,
`db.query(
  'SELECT * FROM users WHERE email = ?',
  [email]
);`,
`sql = f"SELECT * FROM users WHERE email='{email}'"
db.query(sql)`,
`db.query(
    "SELECT * FROM users WHERE email = %s",
    [email],
)`,
'Values must stay data, not become part of SQL grammar.',{attack:"' OR 1=1 --"}),
  P('validate-boundary','security','Validate at the trust boundary','owaspValidation','boundary',
`const user = req.body;
saveUser(user);`,
`const user = UserSchema.parse(req.body);
saveUser(user);`,
`user = request.json
save_user(user)`,
`user = UserPayload.validate(request.json)
save_user(user)`,
'Validation should happen as early as practical when data crosses from an untrusted source.'),
  P('object-authz','security','Authorize the object, not only the route','owaspAuthz','boundary',
`const doc = await db.doc(req.params.id);
res.json(doc);`,
`const doc = await db.doc(req.params.id);
if (!doc || doc.ownerId !== req.user.id) return res.sendStatus(404);
res.json(doc);`,
`doc = db.doc(doc_id)
return doc`,
`doc = db.doc(doc_id)
if not doc or doc.owner_id != user.id:
    raise NotFound()
return doc`,
'Authentication answers who the caller is. Authorization answers whether that caller may perform this action on this object.'),
  P('ssrf','security','Restrict server-side destinations','owaspSsrf','boundary',
`const response = await fetch(req.query.url);`,
`const target = validatePublicHttpsUrl(req.query.url);
const response = await restrictedFetcher.fetch(target);`,
`return await http.get(request.query["url"])`,
`target = validate_public_https_url(request.query["url"])
return await restricted_fetcher.get(target)`,
'Server-side requests inherit the server’s network position. Destination policy and egress controls matter.',{attack:'http://169.254.169.254/'}),
  P('no-eval','security','Do not execute untrusted strings','owaspValidation','boundary',
`const result = eval(req.body.expression);`,
`const ast = parseAllowedExpression(req.body.expression);
const result = evaluateSafeAst(ast);`,
`result = eval(request.json["expression"])`,
`ast = parse_allowed_expression(request.json["expression"])
result = evaluate_safe_ast(ast)`,
'Validation is not enough when the sink is arbitrary code execution. Prefer a constrained parser or explicit operation model.'),
  P('path-traversal','security','Resolve paths inside an allowed root','owaspValidation','boundary',
`const file = path.join(ROOT, req.params.name);
return sendFile(file);`,
`const file = resolveInside(ROOT, req.params.name);
if (!file) return res.sendStatus(400);
return sendFile(file);`,
`path = ROOT / request.path_params["name"]
return send_file(path)`,
`path = resolve_inside(ROOT, request.path_params["name"])
if path is None:
    raise BadRequest()
return send_file(path)`,
'File names are untrusted input. Normalize and enforce containment in an allowed root.'),
  P('secret-env','security','Keep secrets out of source code','owaspValidation','boundary',
`const API_KEY = 'sk_live_...';`,
`const API_KEY = requireSecret('PAYMENTS_API_KEY');`,
`API_KEY = "sk_live_..."`,
`API_KEY = require_secret("PAYMENTS_API_KEY")`,
'Source repositories, logs and client bundles are not secret stores.'),
  P('regex-dos','security','Bound expensive parsing','nodeLoop','cost',
`const ok = /(a+)+$/.test(input);`,
`if (input.length > MAX_LEN) reject();
const ok = safePattern.test(input);`,
`ok = re.match(r"(a+)+$", value)`,
`if len(value) > MAX_LEN:
    raise ValueError("too long")
ok = safe_pattern.match(value)`,
'Algorithmic complexity can become a security issue when attackers choose worst-case input.',{n:24}),

  // AI + MCP
  P('model-not-state','ai','Keep durable state outside the model','mcp','agent',
`const nextState = await model(
  'Remember the account balance and update it'
);`,
`const proposal = await model(buildContext(state));
const nextState = applyValidatedTransition(state, proposal);
await db.save(nextState);`,
`next_state = await model("remember balance and update it")`,
`proposal = await model(build_context(state))
next_state = apply_validated_transition(state, proposal)
await db.save(next_state)`,
'Models are probabilistic processors, not transactional state stores.'),
  P('tool-identity','ai','Do not trust model-supplied identity','mcpAuth','agent',
`async function deleteFile({ userId, path }) {
  return storage.as(userId).delete(path);
}`,
`async function deleteFile(ctx, { path }) {
  authorize(ctx.user, 'delete', path);
  return storage.as(ctx.user.id).delete(path);
}`,
`async def delete_file(user_id, path):
    return await storage.as_user(user_id).delete(path)`,
`async def delete_file(ctx, path):
    authorize(ctx.user, "delete", path)
    return await storage.as_user(ctx.user.id).delete(path)`,
'Identity and authorization must come from trusted host/server context, not model-controlled arguments.'),
  P('prompt-injection','ai','Treat retrieved text as untrusted data','mcp','agent',
`const page = await fetch(url).then(r => r.text());
const action = await model('Follow these instructions: ' + page);
return execute(action);`,
`const page = await fetchUntrusted(url);
const proposal = await model(buildTaskContext(page));
const action = validateAgainstPolicy(proposal);
return executeScoped(action);`,
`page = await fetch(url)
action = await model("follow: " + page)
return await execute(action)`,
`page = await fetch_untrusted(url)
proposal = await model(build_task_context(page))
action = validate_policy(proposal)
return await execute_scoped(action)`,
'Retrieved content can contain adversarial instructions. Tool authority needs deterministic policy outside the prompt.'),
  P('least-tool-scope','ai','Expose the narrowest useful tool','mcp','agent',
`tool('shell', { command: string })`,
`tool('restart_service', {
  service: enumOfAllowedServices
})`,
`tool("shell", command: str)`,
`tool("restart_service", service: AllowedService)`,
'Narrow tools reduce the action surface, simplify validation and make intent easier to audit.'),
  P('rag-evidence','ai','Carry evidence through RAG','mcp','agent',
`const answer = await model(query + retrievedText);`,
`const answer = await model({
  query,
  passages: retrieved.map(p => ({ id:p.id, text:p.text }))
});
// return cited passage ids with the answer`,
`answer = await model(query + retrieved_text)`,
`answer = await model({
    "query": query,
    "passages": [{"id": p.id, "text": p.text} for p in retrieved],
})`,
'Retrieval quality and answer quality are separate. Preserve source identity so outputs can be traced back to evidence.'),
  P('context-budget','ai','Do not dump unlimited context into the model','mcp','agent',
`const context = await db.everything();
return model(JSON.stringify(context));`,
`const context = await retrieveRelevant(query, {
  limit: 12,
  maxTokens: 8000
});
return model(context);`,
`context = await db.everything()
return await model(str(context))`,
`context = await retrieve_relevant(query, limit=12, max_tokens=8000)
return await model(context)`,
'Context is a finite budget. Retrieval, ranking and compression are design decisions.'),
  P('tool-confirmation','ai','Require confirmation for high-impact actions','mcpAuth','agent',
`if (modelSaysDelete) {
  await deleteProductionData();
}`,
`const proposal = validateDeleteProposal(modelOutput);
if (proposal.impact === 'high') {
  await requireUserConfirmation(proposal);
}
await execute(proposal);`,
`if model_says_delete:
    await delete_production_data()`,
`proposal = validate_delete_proposal(model_output)
if proposal.impact == "high":
    await require_user_confirmation(proposal)
await execute(proposal)`,
'Some valid actions still deserve explicit human approval because the blast radius is high.'),
  P('mcp-primitives','ai','Choose the right MCP primitive','mcp','agent',
`// everything is a tool
tool('read_style_guide', ...)
tool('review_prompt', ...)`,
`resource('doc://style-guide', ...)
prompt('review-against-style', ...)
tool('apply_fix', ...)`,
`# everything is exposed as a tool`,
`# resource: contextual data
# prompt: user-invoked template
# tool: executable action`,
'MCP distinguishes resources, prompts and tools because control and risk differ across these primitives.')
];

export const CATEGORIES = [...BASE_CATEGORIES, ...INTERVIEW_CATEGORIES];

export const PATTERNS = [...BASE_PATTERNS, ...ARCHITECTURE_PATTERNS, ...INTERVIEW_PATTERNS];

export function getPattern(id) { return PATTERNS.find(pattern => pattern.id === id); }
export function getCategory(id) { return CATEGORIES.find(category => category.id === id); }
export function patternsFor(category) { return PATTERNS.filter(pattern => pattern.category === category); }
