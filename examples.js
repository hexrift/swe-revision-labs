const pair = (jsBad, jsGood, pyBad, pyGood, why) => ({ javascript:{bad:jsBad,good:jsGood}, typescript:{bad:jsBad,good:jsGood}, python:{bad:pyBad,good:pyGood}, why });

export const EXAMPLES = {
  membership: pair(
`function common(a, b) {
  return a.filter(x => b.includes(x));
}
// O(n × m): includes scans b each time`,
`function common(a, b) {
  const seen = new Set(b);           // O(m)
  return a.filter(x => seen.has(x)); // O(n) expected
}`,
`def common(a, b):
    return [x for x in a if x in b]
# O(n × m) when b is a list`,
`def common(a, b):
    seen = set(b)                    # O(m)
    return [x for x in a if x in seen]  # O(n) expected`,
'Optimise the repeated operation, not the syntax. Building an index once is worthwhile when you perform many lookups.'),

  copying: pair(
`let out = [];
for (const x of items) {
  out = [...out, transform(x)]; // copies out every iteration
}`,
`const out = [];
for (const x of items) {
  out.push(transform(x));
}`,
`out = []
for x in items:
    out = out + [transform(x)]  # repeated list copies`,
`out = []
for x in items:
    out.append(transform(x))`,
'Repeatedly rebuilding a growing sequence can create quadratic copying and heavy transient allocation.'),

  amortized: pair(
`// Misleading explanation:
// "push is always O(1)"
for (const x of input) arr.push(x);`,
`// Better explanation:
// Most pushes write one slot.
// Rare capacity growth copies existing elements.
// Across n pushes total copying is O(n),
// so push is amortized O(1).`,
`# Misleading:
# "append is always O(1)"
for x in data:
    out.append(x)`,
`# Better:
# list append is amortized O(1): occasional resize
# work is spread over many cheap appends.
for x in data:
    out.append(x)`,
'Amortized O(1) is a bound over a sequence; an individual resize can still be expensive.'),

  fibonacci: pair(
`function fib(n) {
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
}`,
`function fib(n, memo = new Map()) {
  if (n < 2) return n;
  if (memo.has(n)) return memo.get(n);
  const v = fib(n - 1, memo) + fib(n - 2, memo);
  memo.set(n, v);
  return v;
}`,
`def fib(n):
    if n < 2: return n
    return fib(n - 1) + fib(n - 2)`,
`def fib(n, memo=None):
    memo = {} if memo is None else memo
    if n < 2: return n
    if n not in memo:
        memo[n] = fib(n-1, memo) + fib(n-2, memo)
    return memo[n]`,
'Memoization collapses repeated subproblems into one computation per state.'),

  jsTraps: pair(
`for (const id of ids) {
  if (blockedIds.includes(id)) continue;
  await fetchUser(id); // serial I/O
}`,
`const blocked = new Set(blockedIds);
const allowed = ids.filter(id => !blocked.has(id));
await mapLimit(allowed, 8, fetchUser);`,
`for user_id in ids:
    if user_id in blocked_ids:  # list scan
        continue
    await fetch_user(user_id)   # serial I/O`,
`blocked = set(blocked_ids)
await bounded_gather(
    [fetch_user(x) for x in ids if x not in blocked],
    limit=8,
)`,
'Two independent problems are hidden here: repeated linear membership scans and unnecessary serial I/O. Fix each explicitly.'),

  pythonTraps: pair(
`// JS analogue: using shift as a queue
while (queue.length) {
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
'Front-removal from contiguous arrays/lists repeatedly moves the remaining elements. Use a queue structure designed for both ends.'),

  nplusone: pair(
`const users = await db.query('SELECT * FROM users LIMIT 100');
for (const user of users) {
  user.team = await db.query('SELECT * FROM teams WHERE id = ?', [user.teamId]);
}`,
`const users = await db.query('SELECT * FROM users LIMIT 100');
const teamIds = [...new Set(users.map(u => u.teamId))];
const teams = await loadTeams(teamIds); // batched query
const byId = new Map(teams.map(t => [t.id, t]));`,
`users = db.query('SELECT * FROM users LIMIT 100')
for user in users:
    user.team = db.query('SELECT * FROM teams WHERE id = ?', [user.team_id])`,
`users = db.query('SELECT * FROM users LIMIT 100')
team_ids = {u.team_id for u in users}
teams = load_teams(team_ids)  # one batched query
by_id = {t.id: t for t in teams}`,
'Count remote round trips as a complexity dimension. N+1 is often more damaging than an in-memory O(n²) loop.'),

  async: pair(
`for (const url of urls) {
  const r = await fetch(url);
  await consume(r);
}`,
`await mapLimit(urls, 8, async url => {
  const r = await fetch(url);
  await consume(r);
});`,
`for url in urls:
    response = await fetch(url)
    await consume(response)`,
`sem = asyncio.Semaphore(8)
async def one(url):
    async with sem:
        return await consume(await fetch(url))
await asyncio.gather(*(one(u) for u in urls))`,
'Independent I/O can overlap, but concurrency should be bounded to protect memory and downstream services.'),

  bounded: pair(
`await Promise.all(items.map(send)); // 50,000 in flight`,
`await mapLimit(items, 20, send); // explicit pressure bound`,
`await asyncio.gather(*(send(x) for x in items))  # unbounded fan-out`,
`sem = asyncio.Semaphore(20)
async def one(x):
    async with sem:
        return await send(x)
await asyncio.gather(*(one(x) for x in items))`,
'Concurrency is a resource budget. Unbounded fan-out can turn a fast producer into an outage amplifier.'),

  race: pair(
`const current = await store.get(key);
await store.set(key, current + 1); // lost update if concurrent`,
`await store.compareAndSwap(key, expectedVersion, nextValue);
// retry on version conflict`,
`current = await store.get(key)
await store.set(key, current + 1)  # lost update`,
`ok = await store.compare_and_swap(key, version, next_value)
if not ok:
    raise RetryConflict()`,
'Protect the whole state transition. A read followed by a write is not atomic just because each operation is individually safe.'),

  cache: pair(
`async function getUser(id) {
  return db.user(id); // repeated expensive read
}`,
`async function getUser(id) {
  const key = 'user:' + id;
  const cached = await cache.get(key);
  if (cached) return cached;
  const user = await db.user(id);
  await cache.set(key, user, { ttl: 60 });
  return user;
}`,
`async def get_user(id):
    return await db.user(id)`,
`async def get_user(id):
    key = f'user:{id}'
    if cached := await cache.get(key):
        return cached
    user = await db.user(id)
    await cache.set(key, user, ttl=60)
    return user`,
'Caching is easy to add and hard to make correct. The missing part in the “good” example is still invalidation/freshness policy.'),

  idempotency: pair(
`app.post('/charge', async (req, res) => {
  const charge = await payments.charge(req.body);
  res.json(charge);
});`,
`app.post('/charge', async (req, res) => {
  const key = req.get('Idempotency-Key');
  const prior = await ops.get(key);
  if (prior) return res.json(prior);
  const result = await payments.charge(req.body);
  await ops.putIfAbsent(key, result);
  res.json(result);
});`,
`async def charge(request):
    return await payments.charge(await request.json())`,
`async def charge(request):
    key = request.headers['Idempotency-Key']
    if prior := await ops.get(key):
        return prior
    result = await payments.charge(await request.json())
    await ops.put_if_absent(key, result)
    return result`,
'Network timeouts create uncertainty. A stable idempotency key lets retries refer to the same logical operation.'),

  http: pair(
`app.get('/users/:id/delete', async (req, res) => {
  await deleteUser(req.params.id);
  res.send('ok');
});`,
`app.delete('/users/:id', async (req, res) => {
  await deleteUser(req.params.id);
  res.sendStatus(204);
});`,
`@app.get('/users/{id}/delete')
async def delete_user(id):
    await users.delete(id)
    return {'ok': True}`,
`@app.delete('/users/{id}', status_code=204)
async def delete_user(id):
    await users.delete(id)`,
'HTTP method semantics matter because caches, crawlers, retries and tooling make assumptions about safe and idempotent operations.'),

  injection: pair(
`const sql = "SELECT * FROM users WHERE email = '" + email + "'";
return db.query(sql);`,
`return db.query('SELECT * FROM users WHERE email = ?', [email]);`,
`sql = f"SELECT * FROM users WHERE email = '{email}'"
return db.query(sql)`,
`return db.query('SELECT * FROM users WHERE email = %s', [email])`,
'Parameterisation keeps untrusted values out of the SQL grammar. Validation is still useful, but it is not a substitute for safe APIs.'),

  auth: pair(
`app.get('/docs/:id', async (req, res) => {
  const doc = await db.doc(req.params.id);
  res.json(doc); // only authenticated, not authorised
});`,
`app.get('/docs/:id', async (req, res) => {
  const doc = await db.doc(req.params.id);
  if (!doc || doc.ownerId !== req.user.id) return res.sendStatus(404);
  res.json(doc);
});`,
`async def get_doc(id, user):
    return await db.doc(id)  # no object-level auth`,
`async def get_doc(id, user):
    doc = await db.doc(id)
    if not doc or doc.owner_id != user.id:
        raise NotFound()
    return doc`,
'Authentication alone does not authorize access to every object. Enforce permission at the resource/action boundary.'),

  ssrf: pair(
`const url = req.query.url;
const response = await fetch(url); // server can reach internal networks`,
`const target = parseAndValidatePublicHttpsUrl(req.query.url);
const response = await restrictedFetcher.fetch(target);`,
`url = request.query['url']
return await http.get(url)`,
`target = parse_and_validate_public_https_url(request.query['url'])
return await restricted_fetcher.get(target)`,
'SSRF defense needs strict destination policy plus network-level egress controls. String checks alone are brittle.'),

  retry: pair(
`while (true) {
  try { return await call(); }
  catch { /* retry immediately forever */ }
}`,
`for (let attempt = 0; attempt < 4; attempt++) {
  try { return await withTimeout(call(), 1500); }
  catch (e) {
    if (!isTransient(e) || attempt === 3) throw e;
    await sleep(jitter(100 * 2 ** attempt));
  }
}`,
`while True:
    try: return await call()
    except Exception: pass`,
`for attempt in range(4):
    try:
        return await with_timeout(call(), 1.5)
    except TransientError:
        if attempt == 3: raise
        await asyncio.sleep(jitter(.1 * (2 ** attempt)))`,
'Retries need a stop condition, retry classification, timeout, backoff and jitter. Otherwise they amplify failures.'),

  index: pair(
`SELECT * FROM events
WHERE lower(email) = lower($1)
ORDER BY created_at DESC;`,
`-- Index design follows the actual predicate/order workload.
CREATE INDEX events_email_created_idx
  ON events (lower(email), created_at DESC);`,
`# ORM code that filters a huge result in Python
rows = await Event.all()
return [r for r in rows if r.email.lower() == email.lower()]`,
`# Push selective work to the database and support it with an index.
return await Event.filter(email__iexact=email).order_by('-created_at')`,
'Indexes only help when their structure matches query shape. Always verify with the planner rather than assuming.'),

  llm: pair(
`const answer = await model(prompt + JSON.stringify(appState));
// Parse prose and trust it to drive side effects`,
`const result = await model({
  input: buildMinimalContext(state),
  response_format: schema
});
const decision = validate(result);
return applyDeterministicPolicy(decision);`,
`answer = await model(prompt + str(app_state))
# parse prose and mutate state`,
`result = await model(
    input=build_minimal_context(state),
    response_schema=Decision,
)
decision = Decision.model_validate(result)
return apply_policy(decision)`,
'Keep durable state and hard business rules outside the model. Constrain and validate model outputs before they affect the world.'),

  mcp: pair(
`// Tool handler trusts model-supplied userId
async function deleteFile({ userId, path }) {
  return storage.as(userId).delete(path);
}`,
`// Authority comes from authenticated host context,
// not model-controlled arguments.
async function deleteFile(ctx, { path }) {
  authorize(ctx.user, 'delete', path);
  return storage.as(ctx.user.id).delete(path);
}`,
`# Tool trusts model-supplied identity
async def delete_file(user_id, path):
    return await storage.as_user(user_id).delete(path)`,
`async def delete_file(ctx, path):
    authorize(ctx.user, 'delete', path)
    return await storage.as_user(ctx.user.id).delete(path)`,
'MCP standardises capability exposure; it does not move trust into the model. Identity and authorization must come from trusted host/server context.'),

  promptInjection: pair(
`const page = await fetch(url).then(r => r.text());
const action = await model('Follow the page instructions: ' + page);
return execute(action);`,
`const page = await fetchUntrusted(url);
const proposal = await model(buildTaskContext(page));
const action = validateAgainstAllowlist(proposal);
if (action.requiresApproval) return requestApproval(action);
return executeScoped(action);`,
`page = await fetch(url)
action = await model('Follow these instructions: ' + page)
return await execute(action)`,
`page = await fetch_untrusted(url)
proposal = await model(build_task_context(page))
action = validate_allowlist(proposal)
if action.requires_approval:
    return await request_approval(action)
return await execute_scoped(action)`,
'Untrusted retrieved text must not become authority. The secure boundary is deterministic validation and scoped capability, not another prompt sentence.'),
};

const starter = {
  javascript: `// Use this scratchpad to test the idea.\nfunction solve(input) {\n  return input;\n}\n\nconsole.log(solve([1, 2, 3]));`,
  typescript: `// TypeScript scratchpad\nfunction solve<T>(input: T): T {\n  return input;\n}\n\nconsole.log(solve([1, 2, 3]));`,
  python: `# Python scratchpad\ndef solve(value):\n    return value\n\nprint(solve([1, 2, 3]))`,
};

const E = (prompt, js, py, jsTests='', pyTests='') => ({ prompt, javascript:{starter:js,tests:jsTests}, typescript:{starter:js,tests:jsTests}, python:{starter:py,tests:pyTests} });

export const EXERCISES = {
  twoSum: E('Implement twoSum(values, target) in expected O(n) time without sorting the input.',
`function twoSum(values, target) {
  // return [i, j] or []
}
`,
`def two_sum(values, target):
    # return [i, j] or []
    pass
`,
`const check = (actual, expected, label) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
};
check(twoSum([2,7,11,15], 9), [0,1], 'basic case');
check(twoSum([3,2,4], 6), [1,2], 'duplicate-safe case');
console.log('2 / 2 checks passed');`,
`def _check(actual, expected, label):
    if actual != expected:
        raise AssertionError(f"{label}: expected {expected!r}, received {actual!r}")

_check(two_sum([2,7,11,15], 9), [0,1], 'basic case')
_check(two_sum([3,2,4], 6), [1,2], 'duplicate-safe case')
print('2 / 2 checks passed')`),

  dedupe: E('Return unique values while preserving first-seen order. Aim for O(n) expected time and explain the extra space.',
`function uniqueStable(values) {
  // implement
}
`,
`def unique_stable(values):
    # implement
    pass
`,
`if (JSON.stringify(uniqueStable([3,1,3,2,1])) !== '[3,1,2]') throw new Error('order/uniqueness');
console.log('✓ checks passed');`,
`assert unique_stable([3,1,3,2,1]) == [3,1,2]
print('✓ checks passed')`),

  climbStairs: E('Implement ways(n): number of ways to climb n steps using 1 or 2 steps. Avoid exponential recursion.',
`function ways(n) {
  // implement O(n) time; O(1) auxiliary space is possible
}
`,
`def ways(n):
    # implement O(n) time; O(1) auxiliary space is possible
    pass
`,
`if (ways(1)!==1 || ways(5)!==8 || ways(20)!==10946) throw new Error('wrong'); console.log('✓ checks passed');`,
`assert ways(1)==1 and ways(5)==8 and ways(20)==10946
print('✓ checks passed')`),

  firstUnique: E('Return the first character that appears exactly once. Target O(n) time.',
`function firstUnique(text) {
  // implement
}
`,
`def first_unique(text):
    # implement
    pass
`,
`if (firstUnique('swiss')!=='w' || firstUnique('aabb')!==null) throw new Error('wrong'); console.log('✓ checks passed');`,
`assert first_unique('swiss') == 'w'
assert first_unique('aabb') is None
print('✓ checks passed')`),

  boundedConcurrency: E('Implement mapLimit(items, limit, fn): preserve output order while never running more than limit promises/coroutines at once.',
`async function mapLimit(items, limit, fn) {
  // implement
}
`,
`import asyncio
async def map_limit(items, limit, fn):
    # implement
    pass
`,
`let active=0, peak=0;
const out=await mapLimit([1,2,3,4,5],2,async x=>{active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,5));active--;return x*2});
if (peak>2 || JSON.stringify(out)!=='[2,4,6,8,10]') throw new Error('limit/order failed'); console.log('✓ checks passed');`,
`active=0
peak=0
async def fn(x):
    global active, peak
    active += 1; peak=max(peak,active)
    await asyncio.sleep(.005)
    active -= 1
    return x*2
out=await map_limit([1,2,3,4,5],2,fn)
assert peak<=2 and out==[2,4,6,8,10]
print('✓ checks passed')`),

  secureQuery: E('Write findUserByEmail(db, email) using a parameterised query. Do not concatenate user input into SQL.',
`async function findUserByEmail(db, email) {
  // db.query(sql, params)
}
`,
`async def find_user_by_email(db, email):
    # db.query(sql, params)
    pass
`,
`const calls=[]; const db={query:(sql,p)=>{calls.push([sql,p]);return []}}; await findUserByEmail(db,"x' OR 1=1 --"); if(calls.length!==1||!Array.isArray(calls[0][1])||calls[0][0].includes("OR 1=1")) throw new Error('not parameterised'); console.log('✓ structure check passed');`,
`class DB:
    def __init__(self): self.calls=[]
    async def query(self, sql, params): self.calls.append((sql,params)); return []
db=DB(); await find_user_by_email(db, "x' OR 1=1 --")
assert len(db.calls)==1 and isinstance(db.calls[0][1], (list,tuple)) and 'OR 1=1' not in db.calls[0][0]
print('✓ structure check passed')`),
};

export function getExample(kind, language) {
  const e = EXAMPLES[kind];
  if (!e) return null;
  return { ...(e[language] || e.javascript), why: e.why };
}

export function getExercise(kind, language) {
  const e = EXERCISES[kind];
  if (!e) return { prompt:'Use the live scratchpad to implement or simulate the concept in your chosen language. Explain complexity and trade-offs in comments.', starter: starter[language], tests:'' };
  return { prompt:e.prompt, ...(e[language] || e.javascript) };
}

export function defaultStarter(language) { return starter[language] || starter.javascript; }
