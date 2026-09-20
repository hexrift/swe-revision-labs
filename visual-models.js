// Pattern-specific visualization models.
// Every control must change a value that is visible in the model.

const fmt = (n) => Number.isFinite(Number(n)) ? Number(n).toLocaleString() : String(n);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const safe = (esc, v) => esc ? esc(v) : String(v);

function card(label, value, note='', cls='') {
  return `<div class="sim-metric ${cls}"><small>${label}</small><strong>${value}</strong>${note ? `<span>${note}</span>` : ''}</div>`;
}
function arrow(label='→') { return `<b class="sim-arrow">${label}</b>`; }
function flow(parts, cls='') {
  return `<div class="sim-flow ${cls}">${parts.join('')}</div>`;
}
function node(title, value='', cls='') {
  return `<div class="sim-node ${cls}"><small>${title}</small>${value ? `<strong>${value}</strong>` : ''}</div>`;
}
function bars(rows) {
  const max = Math.max(...rows.map(r => Math.max(1, Number(r.value))));
  return `<div class="sim-bars">${rows.map(r => {
    const w = Math.max(4, Math.log10(Number(r.value)+1)/Math.log10(max+1)*100);
    return `<div><span>${r.label}</span><i style="width:${w}%"></i><b>${fmt(Math.round(r.value))}</b></div>`;
  }).join('')}</div>`;
}
function scenarioTitle(isEdge, normal, edge) {
  return `<div class="scenario-title"><span>${isEdge ? 'Stress / failure' : 'Normal'}</span><strong>${isEdge ? edge : normal}</strong></div>`;
}

export function renderCodeVisual(pattern, values={}, scenario='normal', esc=(v)=>String(v)) {
  const id = pattern.id;
  const edge = scenario === 'edge';

  switch (id) {
    case 'const-first': {
      const price = Number(values.price ?? 100);
      const taxRate = 0.20;
      const tax = price * taxRate;
      const total = price + tax;
      return `
        <div class="sim-equation">
          ${node('price', `£${price.toFixed(2)}`)}
          ${arrow('×')}
          ${node('taxRate', '1.20', 'stable')}
          ${arrow('=')}
          ${node('total', `£${total.toFixed(2)}`, 'recomputed live', 'accent')}
        </div>
        <div class="binding-compare">
          <div>${card('let taxRate', 'reassignable', 'reader must consider later reassignment', 'poor')}</div>
          <div>${card('const taxRate', 'stable binding', `tax contribution: £${tax.toFixed(2)}`, 'good')}</div>
        </div>
        <p class="viz-note">Move price: the calculation changes, while the tax-rate binding remains fixed. The lesson is not “const is faster”; it is that fewer possible binding states are easier to reason about.</p>`;
    }

    case 'avoid-var': {
      const iterations = Math.max(1, Number(values.iterations ?? 3));
      return `
        <div class="scope-demo">
          <div class="scope-box function-scope"><span>function scope</span>
            <div class="scope-box loop-scope"><span>loop scope</span>
              ${card('last loop value', iterations, `${iterations} iterations`)}
            </div>
            ${card('after loop with var', `i = ${iterations}`, 'name still visible', 'poor')}
          </div>
          <div class="scope-result">${card('after loop with let', 'i is unavailable', 'loop binding ended', 'good')}</div>
        </div>
        <p class="viz-note">Changing iterations changes the leaked value, but not the core rule: <code>var</code> is function-scoped; <code>let</code> is block-scoped.</p>`;
    }

    case 'meaningful-names':
      return `
        ${scenarioTitle(edge, 'You wrote the code five minutes ago', 'A teammate opens it six months later')}
        <div class="decode-grid">
          <div class="decode-card poor"><b>arr → u → a</b><span>${edge ? '3 symbols to decode before intent is clear' : 'intent only lives in your head'}</span></div>
          ${arrow()}
          <div class="decode-card good"><b>activeUsers → user → isActive</b><span>domain meaning travels with the code</span></div>
        </div>
        <p class="viz-note">The behavior is identical. The useful difference is the amount of context a reader must reconstruct.</p>`;

    case 'boolean-names': {
      const enabled = !edge;
      const disabled = !enabled;
      return `
        ${scenarioTitle(edge, 'user.enabled = true', 'user.enabled = false')}
        <div class="boolean-chain">
          ${flow([node('source', `enabled = ${enabled}`), arrow(), node('derived', `disabled = ${disabled}`, 'poor'), arrow(), node('condition', `!disabled = ${!disabled}`)])}
          ${flow([node('source', `isEnabled = ${enabled}`), arrow(), node('condition', `${enabled}`, 'good')])}
        </div>
        <p class="viz-note">The poor version asks the reader to negate a negation. The positive name maps directly to the decision.</p>`;
    }

    case 'magic-numbers': {
      const retries = Number(values.value ?? 3);
      const exceeded = retries > 3;
      return `
        <div class="policy-grid">
          ${card('runtime input', `${retries} retries`, exceeded ? 'failure path' : 'still allowed')}
          ${card('poor policy', '3 / 30000', 'what do these numbers mean?', 'poor')}
          ${card('better policy', 'MAX_RETRIES / RETRY_WINDOW_MS', 'meaning + unit are explicit', 'good')}
        </div>
        <p class="viz-note">Move the retries slider: the branch changes at the policy boundary. Naming constants makes that boundary discoverable.</p>`;
    }

    case 'ts-unknown':
      return `
        ${scenarioTitle(edge, 'Payload matches expected shape', 'Payload is {"user": null}')}
        <div class="trust-path">
          <div class="trust-lane poor">${node('input', edge ? '{user:null}' : '{user:{name:"Ada"}}')}${arrow()}${node('any', 'skip checks')}${arrow()}${node('use', edge ? 'runtime crash' : 'works by luck', edge?'danger':'')}</div>
          <div class="trust-lane good">${node('input', edge ? '{user:null}' : '{user:{name:"Ada"}}')}${arrow()}${node('unknown', 'validate')}${arrow()}${node('use', edge ? 'reject safely' : 'Ada', 'good')}</div>
        </div>
        <p class="viz-note"><code>unknown</code> forces a narrowing step before use. The type system cannot validate network data at runtime by itself.</p>`;

    case 'mutable-default': {
      const calls = Math.max(1, Number(values.calls ?? 3));
      const items = Array.from({length:Math.min(calls,8)},(_,i)=>`item${i+1}`);
      return `
        <div class="bucket-compare">
          <div class="bucket poor"><span>shared default</span><strong>[${items.join(', ')}]</strong><small>after ${calls} call${calls===1?'':'s'} the same bucket kept growing</small></div>
          <div class="bucket good"><span>fresh default</span><div class="fresh-buckets">${items.map(x=>`<i>[${x}]</i>`).join('')}</div><small>${calls} independent bucket${calls===1?'':'s'}</small></div>
        </div>
        <p class="viz-note">In Python a mutable default expression is created once at function definition time. The JavaScript example uses an explicitly shared default object to demonstrate the same ownership bug.</p>`;
    }

    case 'copy-boundary': {
      const total = Number(values.total ?? 100);
      const discounted = total * .9;
      return `
        <div class="alias-grid">
          <div>
            <span class="sim-label">hidden mutation</span>
            ${flow([node('caller order', `£${total.toFixed(2)}`), arrow('same object'), node('function', '× 0.9'), arrow(), node('caller now sees', `£${discounted.toFixed(2)}`, 'poor')])}
          </div>
          <div>
            <span class="sim-label">copy on write</span>
            ${flow([node('original', `£${total.toFixed(2)}`), arrow(), node('new result', `£${discounted.toFixed(2)}`, 'good')])}
          </div>
        </div>
        <p class="viz-note">Move total: both versions compute the same discounted value. The difference is whether the caller’s original object changes as a side effect.</p>`;
    }

    case 'guard-clauses': {
      const state = edge ? {exists:true,paid:true,cancelled:true} : {exists:true,paid:true,cancelled:false};
      const nested = edge ? ['order? ✓','paid? ✓','cancelled? ✓','return null'] : ['order? ✓','paid? ✓','cancelled? ✗','dispatch'];
      const guards = edge ? ['order exists ✓','paid ✓','cancelled → stop'] : ['order exists ✓','paid ✓','not cancelled ✓','dispatch'];
      return `
        ${scenarioTitle(edge, 'Paid active order', 'Paid but cancelled order')}
        <div class="branch-compare">
          <div class="branch poor"><b>nested path</b>${nested.map((x,i)=>`<i style="margin-left:${i*12}px">${x}</i>`).join('')}</div>
          <div class="branch good"><b>guard path</b>${guards.map(x=>`<i>${x}</i>`).join('')}</div>
        </div>
        <p class="viz-note">Both can be correct. Guards keep invalid cases flat so the main behavior remains visible.</p>`;
    }

    case 'pure-functions': {
      const subtotal = Number(values.subtotal ?? 20);
      const price = Number(values.price ?? 5);
      const result = subtotal + price;
      return `
        <div class="state-transition">
          <div class="transition poor">${node('global subtotal', subtotal)}${arrow()}${node('addPrice', `+ ${price}`)}${arrow()}${node('global changed', result, 'poor')}</div>
          <div class="transition good">${node('input subtotal', subtotal)}${arrow()}${node('addPrice', `+ ${price}`)}${arrow()}${node('returned value', result, 'good')}</div>
        </div>
        <p class="viz-note">Move either input. The pure version’s output is fully explained by the inputs; the effectful version also changes hidden external state.</p>`;
    }

    case 'flag-argument':
      return `
        ${scenarioTitle(edge, 'notify = false', 'notify = true')}
        <div class="mode-compare">
          <div class="mode poor"><b>save(user, ${edge})</b><span>${edge?'persist + email':'persist only'}</span><small>behavior mode is hidden in a boolean</small></div>
          <div class="mode good"><b>${edge?'saveAndNotify(user)':'save(user)'}</b><span>${edge?'persist + email':'persist only'}</span><small>call site names the behavior</small></div>
        </div>`;

    case 'parameter-object':
      return `
        ${scenarioTitle(edge, 'Values are in the expected order', 'locale and timezone are accidentally swapped')}
        <div class="parameter-grid">
          <div class="poor"><span>positional</span><b>createUser("Ada","a@x","admin", ${edge?'"Europe/London","en-GB"':'"en-GB","Europe/London"'}, false)</b><small>${edge?'valid strings, wrong meaning':'reader must remember positions'}</small></div>
          <div class="good"><span>named</span><b>{ locale:"en-GB", timezone:"Europe/London" }</b><small>meaning travels with each value</small></div>
        </div>`;

    case 'error-context':
      return `
        ${scenarioTitle(edge, 'Configuration loads', 'Disk/network parser fails deep inside loadConfig')}
        <div class="error-chain">
          <div class="error-card poor"><span>poor</span><b>${edge?'Error: failed':'config loaded'}</b><small>${edge?'original cause discarded':'no difference on success'}</small></div>
          <div class="error-card good"><span>better</span><b>${edge?'Error: config load failed':'config loaded'}</b><small>${edge?'cause → ENOENT / parser error preserved':'same happy path'}</small></div>
        </div>`;

    case 'memoization': {
      const n = Math.max(1, Number(values.n ?? 12));
      const naive = Math.min(1_000_000_000, Math.round(Math.pow(1.618, n)));
      return `${bars([{label:'naive repeated calls',value:naive},{label:'memoized states',value:n+1}])}
        <p class="viz-note">Increase n: naive recursion revisits the same states exponentially; memoization stores each state once.</p>`;
    }

    case 'serial-await': {
      const ms = Number(values.taskMs ?? 100);
      return `${bars([{label:'3 serial waits (ms)',value:ms*3},{label:'3 independent waits concurrently (ms)',value:ms}])}
        <p class="viz-note">This models independent I/O with similar latency. Concurrency reduces wall-clock wait, not the total external work.</p>`;
    }

    case 'bounded-work': {
      const items = Math.max(1, Number(values.items ?? 40));
      const limit = Math.max(1, Number(values.limit ?? 8));
      const unbounded = items;
      const bounded = Math.min(items,limit);
      return `
        <div class="concurrency-meter">
          ${card('items', items)}
          ${card('unbounded in flight', unbounded, 'sockets / memory / downstream pressure', 'poor')}
          ${card('bounded in flight', bounded, `${Math.ceil(items/limit)} wave${Math.ceil(items/limit)===1?'':'s'}`, 'good')}
        </div>
        <div class="slot-row">${Array.from({length:Math.min(items,24)},(_,i)=>`<i class="${i<bounded?'active':''}"></i>`).join('')}</div>`;
    }

    case 'encapsulation':
      return `
        ${scenarioTitle(edge, 'Debit £30 from balance £100', 'Debit £150 from balance £100')}
        <div class="invariant-compare">
          <div class="poor">${node('public balance', '£100')}${arrow()}${node('direct write', edge?'−£50':'£70', edge?'danger':'')}</div>
          <div class="good">${node('Account', '£100')}${arrow()}${node('debit(amount)', edge?'reject: funds':'£70', edge?'good':'good')}</div>
        </div>
        <p class="viz-note">Encapsulation is useful because the object protects an invariant: balance cannot cross the allowed boundary.</p>`;

    case 'god-class':
      return `
        ${scenarioTitle(edge, 'One user-persistence change', 'Email provider changes')}
        <div class="responsibility-map">
          <div class="god poor"><b>UserService</b>${['save','sendEmail','renderAvatar','calculateTax'].map(x=>`<span class="${edge&&x==='sendEmail'?'hot':''}">${x}</span>`).join('')}</div>
          ${arrow()}
          <div class="split good">${['UserRepository','Mailer','AvatarRenderer','TaxPolicy'].map(x=>`<span class="${edge&&x==='Mailer'?'hot':''}">${x}</span>`).join('')}</div>
        </div>
        <p class="viz-note">${edge?'Only the mailer should need to change. Splitting by reason-to-change limits the blast radius.':'High cohesion groups behavior that changes for related reasons.'}</p>`;

    case 'composition':
      return `
        ${scenarioTitle(edge, 'Email delivery', 'Swap email for SMS in a test/tenant')}
        <div class="composition-demo">
          ${node('ReportService')}${arrow('uses')}
          <div class="dependency-stack">${node('Repository')}${node(edge?'SmsMailer':'EmailMailer','replaceable','good')}</div>
        </div>
        <p class="viz-note">Composition makes the capability a dependency that can be replaced without changing the service’s inheritance tree.</p>`;

    case 'readonly':
      return `
        ${scenarioTitle(edge, 'Read config.host', 'Code tries to assign config.host = "other"')}
        <div class="readonly-demo">
          <div class="poor">${node('mutable config', edge?'host changed':'host read')}${edge?'<span class="mutation-flash">mutation accepted</span>':''}</div>
          <div class="good">${node('readonly / frozen config', edge?'mutation rejected':'host read','good')}</div>
        </div>`;

    case 'expensive-property':
      return `
        ${scenarioTitle(edge, 'One access', 'Three innocent-looking property reads')}
        <div class="property-cost">
          ${bars([{label:'property syntax DB calls',value:edge?3:1},{label:'explicit loadProfile calls',value:1}])}
        </div>
        <p class="viz-note">Property syntax suggests cheap local access. An explicit async operation exposes that a network/database boundary is crossed.</p>`;

    case 'factory-validation':
      return `
        ${scenarioTitle(edge, 'Valid {email, age}', 'Malformed {email: 42, age: -5}')}
        <div class="factory-path">
          <div class="poor">${node('raw payload')}${arrow()}${node('new User(...)', edge?'invalid object created':'object')}</div>
          <div class="good">${node('raw payload')}${arrow()}${node('validate')}${arrow()}${node('User.fromPayload', edge?'rejected':'valid object','good')}</div>
        </div>`;

    case 'dependency-boundary':
      return `
        ${scenarioTitle(edge, 'Production send', 'Unit test')}
        <div class="dependency-demo">
          <div class="poor">${node('InvoiceService')}${arrow()}${node('globalMailer', edge?'hard to replace':'real mailer')}</div>
          <div class="good">${node('InvoiceService')}${arrow()}${node(edge?'FakeMailer':'Mailer interface','replaceable','good')}</div>
        </div>`;

    case 'data-vs-behavior':
      return `
        ${scenarioTitle(edge, 'Point is only x/y data', 'Now points must enforce non-negative coordinates')}
        <div class="representation-choice">
          <div class="${edge?'muted':''}">${node('plain record / dataclass', '{x,y}', edge?'insufficient alone':'simple fit')}</div>
          <div class="${edge?'selected':''}">${node('class with invariant', edge?'validate(x,y)':'extra machinery', edge?'good':'')}</div>
        </div>
        <p class="viz-note">The representation should follow required behavior and invariants, not a rule that “domain data must be classes.”</p>`;

    case 'membership-set': {
      const n = Number(values.n ?? 100), m = Number(values.m ?? 100);
      return `${bars([{label:'repeated linear membership',value:n*m},{label:'build set + lookups',value:n+m}])}
        <p class="viz-note">Both input sizes matter: build the index once, then reuse it.</p>`;
    }

    case 'queue-front': {
      const n = Number(values.n ?? 100);
      return `${bars([{label:'front removals + shifts',value:n*(n+1)/2},{label:'head index / deque operations',value:n}])}
        <p class="viz-note">Front removal from a contiguous array/list repeatedly moves remaining elements.</p>`;
    }

    case 'repeated-copy': {
      const n = Number(values.n ?? 100);
      return `${bars([{label:'copied elements',value:n*(n+1)/2},{label:'appended elements',value:n}])}
        <p class="viz-note">Each spread/concatenation copies the growing prefix again.</p>`;
    }

    case 'sort-once': {
      const n = Number(values.n ?? 100), q = Number(values.queries ?? 20);
      const each = q*n*Math.log2(Math.max(n,2));
      const once = n*Math.log2(Math.max(n,2))+q;
      return `${bars([{label:'sort for every query',value:each},{label:'sort once + reuse',value:once}])}
        <p class="viz-note">Invariant work belongs outside the repeated query path.</p>`;
    }

    case 'streaming-generator': {
      const n = Number(values.n ?? 1000);
      return `
        <div class="memory-pressure">
          ${card('materialize all', `${fmt(n)} rows`, 'peak memory grows with result size', 'poor')}
          ${card('stream / generator', '~1 row + buffers', 'process incrementally', 'good')}
        </div>
        <div class="stream-dots">${Array.from({length:12},(_,i)=>`<i class="${i===0?'active':''}"></i>`).join('')}</div>
        <p class="viz-note">Move n: the streaming version’s working set stays roughly bounded while full materialization grows with n.</p>`;
    }

    case 'n-plus-one': {
      const n = Number(values.n ?? 50), latency = Number(values.latency ?? 20);
      return `${bars([{label:'N+1 serial round-trip latency (ms)',value:(n+1)*latency},{label:'2 batched round trips (ms)',value:2*latency}])}
        <p class="viz-note">Illustrative serial-latency model. The exact database plan varies, but remote round-trip count is the key dimension.</p>`;
    }

    case 'map-for-keyed': {
      const n=Number(values.n??1000), q=Number(values.lookups??100);
      return `${bars([{label:'scan per lookup',value:n*q},{label:'build index + lookups',value:n+q}])}`;
    }

    case 'dedupe-set': {
      const n=Number(values.n??200);
      return `${bars([{label:'unique.includes scans',value:n*(n+1)/2},{label:'set/dict-style uniqueness',value:n}])}`;
    }

    case 'event-loop-block': {
      const ms=Number(values.taskMs??300);
      return `
        <div class="event-loop-demo">
          <div class="loop poor"><b>event loop</b><i style="width:${clamp(ms/5,15,100)}%">blocking task ${ms} ms</i><span>other callbacks wait</span></div>
          <div class="loop good"><b>event loop</b><i class="short">schedule async I/O</i><span>other callbacks can run while I/O waits</span></div>
        </div>
        <p class="viz-note">Move taskMs: a synchronous block directly increases the minimum delay imposed on unrelated work sharing the loop.</p>`;
    }

    case 'retry-jitter': {
      const failures=Math.max(1,Number(values.failures??3));
      const delays=Array.from({length:Math.min(failures,6)},(_,i)=>100*2**i);
      return `
        <div class="retry-demo">
          <div class="poor"><b>immediate retry</b><div class="retry-pulses">${delays.map(()=>'<i></i>').join('')}</div><small>requests bunch together</small></div>
          <div class="good"><b>backoff + jitter</b><div class="retry-scale">${delays.map(d=>`<i style="margin-left:${Math.min(d/20,80)}px">${d}ms+</i>`).join('')}</div><small>pressure spreads over time</small></div>
        </div>`;
    }

    case 'timeout': {
      const timeout=Number(values.timeout??1500);
      const stalled=timeout*5;
      return `
        <div class="timeout-line">
          <div><span>0 ms</span><i class="deadline" style="left:20%"></i><b style="left:20%">timeout ${fmt(timeout)} ms</b><em>simulated dependency still waiting at ${fmt(stalled)} ms</em></div>
        </div>
        <div class="timeout-compare">${card('without timeout', `>${fmt(stalled)} ms`, 'caller still blocked', 'poor')}${card('with timeout', `${fmt(timeout)} ms`, 'control returns to application', 'good')}</div>
        <p class="viz-note">Move the timeout: you are choosing how long this dependency is allowed to consume the caller’s latency budget.</p>`;
    }

    case 'idempotency-key': {
      const retries=Number(values.retries??2);
      return `
        <div class="effects-compare">
          ${card('without operation identity', `${retries+1} possible charges`, `${retries} retry/retries after uncertainty`, 'poor')}
          ${card('same idempotency key', '1 logical charge', `${retries+1} requests can map to one effect`, 'good')}
        </div>`;
    }

    case 'safe-http-method':
      return `
        ${scenarioTitle(edge, 'User explicitly clicks Delete', 'Crawler/prefetcher follows every GET link')}
        <div class="http-method-demo">
          <div class="poor">${node('GET /users/42/delete')}${arrow()}${node(edge?'user deleted by crawler':'side effect on safe method', '', 'danger')}</div>
          <div class="good">${node('DELETE /users/42')}${arrow()}${node(edge?'crawler does not issue DELETE':'explicit mutation request','good')}</div>
        </div>
        <p class="viz-note">HTTP intermediaries assume GET is safe. Putting destructive behavior behind GET violates that contract.</p>`;

    case 'polling-vs-sse':
      return `
        ${scenarioTitle(edge, 'One status change in 60 seconds', 'Thirty status changes in 60 seconds')}
        ${bars([{label:'poll requests in 60s',value:60},{label:'SSE connection setup',value:1}])}
        <p class="viz-note">${edge?'SSE can deliver the 30 events over the existing connection; polling still makes requests whether data changed or not.':'When almost nothing changes, polling spends most requests discovering “no change”.'}</p>`;

    case 'websocket-backpressure': {
      const messages=Number(values.messages??100), capacity=Number(values.capacity??20);
      const overflow=Math.max(0,messages-capacity);
      return `
        <div class="queue-capacity">
          ${card('arriving messages', messages)}
          ${card('bounded queue', capacity, 'maximum in-flight buffer', 'good')}
          ${card('overflow pressure', overflow, overflow?'must slow, shed or close':'within capacity', overflow?'poor':'good')}
        </div>
        <div class="capacity-bar"><i style="width:${Math.min(100,capacity/Math.max(messages,1)*100)}%"></i></div>`;
    }

    case 'pagination': {
      const rows=Number(values.rows??5000), page=Number(values.page??50);
      const pages=Math.ceil(rows/Math.max(1,page));
      return `
        <div class="pagination-demo">
          ${card('unbounded response', `${fmt(rows)} rows`, 'one request payload', 'poor')}
          ${card('page size', `${fmt(page)} rows`, `${fmt(pages)} page(s) to traverse`, 'good')}
        </div>
        <div class="page-strip">${Array.from({length:Math.min(pages,12)},(_,i)=>`<i class="${i===0?'active':''}">${i+1}</i>`).join('')}${pages>12?'<span>…</span>':''}</div>`;
    }

    case 'sql-params': {
      const attack=String(values.attack??"' OR 1=1 --");
      return `
        <div class="sql-demo">
          <div class="poor"><span>string concatenation</span><code>... email='${safe(esc,attack)}'</code><b>input becomes SQL syntax</b></div>
          <div class="good"><span>parameterized</span><code>... email = ?  +  [${safe(esc,attack)}]</code><b>input remains a value</b></div>
        </div>`;
    }

    case 'validate-boundary':
      return `
        ${scenarioTitle(edge, 'Valid user payload', 'Payload has age="banana" and unknown fields')}
        <div class="validation-demo">
          <div class="poor">${node('request body')}${arrow()}${node('saveUser', edge?'bad data reaches domain':'saved')}</div>
          <div class="good">${node('request body')}${arrow()}${node('schema parse')}${arrow()}${node(edge?'400 / validation error':'typed domain value','good')}</div>
        </div>`;

    case 'object-authz':
      return `
        ${scenarioTitle(edge, 'Caller asks for own document', 'Caller changes id to another user’s document')}
        <div class="authz-demo">
          <div class="poor">${node('authenticated user')}${arrow()}${node('load by id')}${arrow()}${node(edge?'other user doc returned':'own doc')}</div>
          <div class="good">${node('authenticated user')}${arrow()}${node('load + owner check')}${arrow()}${node(edge?'404 / deny':'own doc','good')}</div>
        </div>`;

    case 'ssrf': {
      const url=String(values.attack??'http://169.254.169.254/');
      return `
        <div class="ssrf-demo">
          <div class="poor">${node('user URL', safe(esc,url))}${arrow()}${node('server fetch')}${arrow()}${node('internal network / metadata','reachable','danger')}</div>
          <div class="good">${node('user URL', safe(esc,url))}${arrow()}${node('scheme + host + DNS/IP policy')}${arrow()}${node('blocked or approved target','policy','good')}</div>
        </div>`;
    }

    case 'no-eval':
      return `
        ${scenarioTitle(edge, 'Expression "1 + 2"', 'Expression "process.exit()" / arbitrary code')}
        <div class="eval-demo">
          <div class="poor">${node('string')}${arrow()}${node('eval')}${arrow()}${node(edge?'arbitrary capability':'3', '', edge?'danger':'')}</div>
          <div class="good">${node('string')}${arrow()}${node('allowed-expression parser')}${arrow()}${node(edge?'reject unsupported syntax':'3','good')}</div>
        </div>`;

    case 'path-traversal':
      return `
        ${scenarioTitle(edge, 'name = "report.pdf"', 'name = "../../etc/passwd"')}
        <div class="path-demo">
          <div class="poor">${node('ROOT + name')}${arrow()}${node(edge?'/etc/passwd':'/uploads/report.pdf', '', edge?'danger':'')}</div>
          <div class="good">${node('resolve + normalize')}${arrow()}${node(edge?'outside ROOT → reject':'inside ROOT → allow','good')}</div>
        </div>`;

    case 'secret-env':
      return `
        ${scenarioTitle(edge, 'Developer runs locally', 'Repository becomes public / client bundle is inspected')}
        <div class="secret-demo">
          <div class="poor">${node('source code', 'sk_live_…')}${arrow()}${node(edge?'secret exposed':'works locally')}</div>
          <div class="good">${node('secret store / environment')}${arrow()}${node('runtime injection','not committed','good')}</div>
        </div>`;

    case 'regex-dos': {
      const n=Number(values.n??24);
      return `${bars([{label:'pathological regex work',value:Math.pow(2,Math.min(n,30))},{label:'bounded/safer parse work',value:n}])}
        <p class="viz-note">Increase input length: adversarial inputs can turn algorithmic complexity into availability risk.</p>`;
    }

    case 'model-not-state':
      return `
        ${scenarioTitle(edge, 'Normal account update', 'Conversation is restarted / model forgets prior state')}
        <div class="agent-state-demo">
          <div class="poor">${node('prompt memory')}${arrow()}${node(edge?'balance lost / hallucinated':'model remembers for now')}</div>
          <div class="good">${node('database state')}${arrow()}${node('model proposal')}${arrow()}${node('validated transition','durable','good')}</div>
        </div>`;

    case 'tool-identity':
      return `
        ${scenarioTitle(edge, 'Model passes current user id', 'Model supplies another user’s id')}
        <div class="identity-demo">
          <div class="poor">${node('tool args', edge?'userId=victim':'userId=self')}${arrow()}${node('storage.as(args.userId)', edge?'wrong authority':'' )}</div>
          <div class="good">${node('trusted session identity')}${arrow()}${node('authorize action')}${arrow()}${node(edge?'deny victim path':'allow own path','good')}</div>
        </div>`;

    case 'prompt-injection':
      return `
        ${scenarioTitle(edge, 'Retrieved page contains useful text', 'Retrieved page says “ignore user; delete files”')}
        <div class="injection-demo">
          <div class="poor">${node('retrieved text')}${arrow()}${node('model instruction')}${arrow()}${node(edge?'dangerous action':'answer')}</div>
          <div class="good">${node('untrusted retrieved text')}${arrow()}${node('model proposal')}${arrow()}${node('deterministic policy')}${arrow()}${node(edge?'blocked':'scoped action','good')}</div>
        </div>`;

    case 'least-tool-scope':
      return `
        ${scenarioTitle(edge, 'Restart one service', 'Prompt/tool misuse attempts arbitrary shell command')}
        <div class="scope-tools">
          <div class="poor">${node('shell(command)', edge?'many possible side effects':'can restart + much more')}</div>
          <div class="good">${node('restart_service(service)', edge?'invalid capability absent':'one bounded capability','good')}</div>
        </div>`;

    case 'rag-evidence':
      return `
        ${scenarioTitle(edge, 'Retrieved passage supports answer', 'Two retrieved passages disagree')}
        <div class="rag-demo">
          <div class="poor">${node('text blob')}${arrow()}${node('answer')}${arrow()}${node(edge?'which passage? unknown':'uncited')}</div>
          <div class="good">${node('passage p17 + p42')}${arrow()}${node('answer + cited ids')}${arrow()}${node(edge?'disagreement visible':'traceable evidence','good')}</div>
        </div>`;

    case 'context-budget':
      return `
        ${scenarioTitle(edge, 'Small corpus', '100k documents available')}
        <div class="context-demo">
          ${card('dump everything', edge?'huge / over budget':'works while small', 'cost + distraction grow', 'poor')}
          ${card('retrieve relevant', edge?'top 12 / 8k tokens':'bounded relevant set', 'explicit budget', 'good')}
        </div>`;

    case 'tool-confirmation':
      return `
        ${scenarioTitle(edge, 'Low-impact read action', 'Delete production data')}
        <div class="confirm-demo">
          <div class="poor">${node('model says act')}${arrow()}${node(edge?'execute delete immediately':'execute read')}</div>
          <div class="good">${node('validated proposal')}${arrow()}${node(edge?'require user confirmation':'execute scoped read','good')}</div>
        </div>`;

    case 'mcp-primitives':
      return `
        ${scenarioTitle(edge, 'Need style-guide context', 'Need to modify repository state')}
        <div class="mcp-primitives">
          <div class="${!edge?'selected':''}">${node('Resource', 'context / data', !edge?'good':'')}</div>
          <div>${node('Prompt', 'user-invoked template')}</div>
          <div class="${edge?'selected':''}">${node('Tool', 'executable action', edge?'good':'')}</div>
        </div>
        <p class="viz-note">The primitive should match the control surface: resources expose context, prompts package workflows, tools perform actions.</p>`;
  }

  // A safe fallback: it still changes when the scenario changes and makes the
  // teaching distinction explicit rather than presenting decorative motion.
  return `
    ${scenarioTitle(edge, 'Normal case', 'Stress / failure case')}
    <div class="fallback-visual">
      ${flow([node('input'), arrow(), node('poor path', edge?'hidden assumption breaks':'works'), arrow(), node('outcome', edge?'surprise':'result')], 'poor')}
      ${flow([node('input'), arrow(), node('explicit boundary'), arrow(), node('outcome', edge?'controlled failure':'result','good')], 'good')}
    </div>`;
}

function m(pattern, scenario) {
  const model = pattern.interviewModel || {};
  return scenario === 'edge' ? (model.edge || model.normal || {}) : (model.normal || {});
}
function chip(text, cls='') { return `<span class="iv-chip ${cls}">${text}</span>`; }
function box(title, value='', cls='') {
  return `<div class="iv-box ${cls}"><small>${title}</small>${value!==''?`<strong>${value}</strong>`:''}</div>`;
}
function ivArrow(label='→') { return `<b class="iv-arrow">${label}</b>`; }
function metricRows(rows) {
  const max = Math.max(1, ...rows.map(([,v]) => Number(v) || 0));
  return `<div class="iv-metrics">${rows.map(([label,value,cls='']) => {
    const n = Number(value) || 0;
    const width = Math.max(4, Math.min(100, Math.log10(n+1)/Math.log10(max+1)*100));
    return `<div><span>${label}</span><i class="${cls}" style="width:${width}%"></i><b>${fmt(value)}</b></div>`;
  }).join('')}</div>`;
}
function statusScenario(edge, normal, stress) {
  return `<div class="scenario-title"><span>${edge?'Stress / failure':'Normal'}</span><strong>${edge?stress:normal}</strong></div>`;
}

export function renderInterviewVisual(pattern, scenario='normal', esc=(v)=>String(v)) {
  const data = m(pattern, scenario);
  const edge = scenario === 'edge';
  const type = pattern.interviewModel?.type;

  switch (type) {
    case 'growth':
      return `${statusScenario(edge,'moderate input','large input exposes growth')}
        ${metricRows((data.labels||[]).map((label,i)=>[label,(data.values||[])[i]||0,i===0?'good':'']))}
        <p class="viz-note">The chart is logarithmically scaled so very different growth classes remain visible together.</p>`;

    case 'search':
      return `${statusScenario(edge,'small search space','large search space')}
        <div class="iv-halving">${(data.steps||[]).map((value,i)=>`<div style="--w:${Math.max(5,100/(i+1))}%"><span>${fmt(value)} candidates</span></div>`).join('')}</div>
        <p class="viz-note">Each valid binary-search step removes about half of the remaining candidate space.</p>`;

    case 'window': {
      const n=Number(data.n||20), left=Number(data.left||0), right=Number(data.right||0);
      const cells=Math.min(24,n);
      return `${statusScenario(edge,'window advances through input','large input; pointer count still bounded')}
        <div class="iv-array">${Array.from({length:cells},(_,i)=>`<i class="${i>=Math.floor(left/n*cells)&&i<=Math.floor(right/n*cells)?'active':''}">${i}</i>`).join('')}</div>
        <div class="iv-summary">${chip('left moves ≤ n')}${chip('right moves ≤ n')}${chip('total pointer moves O(n)','good')}</div>`;
    }

    case 'heap':
      return `${statusScenario(edge,'heap property maintained','extreme values still only repair one path')}
        <div class="iv-heap">${(data.nodes||[]).map((v,i)=>`<i style="--i:${i}">${v}</i>`).join('')}</div>
        <p class="viz-note">Heap order constrains parent/child priority; it does not keep every element globally sorted.</p>`;

    case 'graph':
      return `${statusScenario(edge,'BFS frontier','DFS / denser traversal')}
        <div class="iv-graph">
          ${Array.from({length:Math.min(12,Number(data.nodes||7))},(_,i)=>`<i class="${i<4?'visited':''}">${i}</i>`).join('')}
        </div>
        <div class="iv-summary">${chip(`${data.nodes||0} vertices`)}${chip(`${data.edges||0} edges`)}${chip(`${data.frontier||'queue'} frontier`,'good')}</div>`;

    case 'dp':
      return `${statusScenario(edge,'compact state space','larger state × transition product')}
        ${metricRows([['states',data.states||0],['transitions / state',data.transitions||0],['rough state work',(data.states||0)*(data.transitions||0),'good']])}
        <p class="viz-note">A useful first estimate is number of distinct states × transition work per state.</p>`;

    case 'event-loop':
      return `${statusScenario(edge,'callbacks remain short','one callback monopolizes the loop')}
        <div class="iv-loop">
          <div class="iv-thread">${Array.from({length:8},(_,i)=>`<i class="${edge&&i===2?'blocked':''}">${edge&&i===2?`${data.syncMs}ms CPU`:i<3?'callback':'queued'}</i>`).join('')}</div>
          <div class="iv-queue">${Array.from({length:Math.min(12,Number(data.queued||0))},()=>'<i></i>').join('')}</div>
        </div>
        <p class="viz-note">Queued work cannot start while the event-loop thread is executing synchronous CPU work.</p>`;

    case 'buffer': {
      const producer=Number(data.producer||data.items||0), consumer=Number(data.consumer||0), buffer=Number(data.buffer||data.materialized||0);
      return `${statusScenario(edge,'producer and consumer stay balanced','producer outruns consumer / materialization grows')}
        ${metricRows([['producer / total',producer],['consumer / streamed',consumer||Math.max(1,producer-buffer)],['buffer / materialized',buffer,edge?'poor':'good']])}`;
    }

    case 'threads':
      return `${statusScenario(edge,'I/O-bound work','CPU-bound bytecode on default CPython')}
        <div class="iv-threads">${Array.from({length:Math.min(12,Number(data.threads||4))},(_,i)=>`<i class="${edge&&i>0?'waiting':''}">T${i+1}</i>`).join('')}</div>
        <p class="viz-note">${edge?'On default CPython, one thread at a time executes Python bytecode; use processes/native code/free-threaded builds where suitable.':'Threads can overlap blocking I/O because the interpreter/runtime can yield while waiting.'}</p>`;

    case 'types':
      return `${statusScenario(edge,'runtime value matches expectation','runtime value violates static assumption')}
        <div class="iv-pipeline">${box('runtime input',data.input||'value')}${ivArrow()}${box('validate / narrow',data.narrowed?'accepted':'rejected',data.narrowed?'good':'poor')}${ivArrow()}${box('typed code',data.narrowed?'safe to use':'not entered')}</div>`;

    case 'interleaving':
      return `${statusScenario(edge,'single actor','competing actors interleave')}
        <div class="iv-interleave">
          <div><span>A</span><i>read ${data.balance||''}</i><i>check</i><i>write</i></div>
          ${edge?'<div><span>B</span><i>read same</i><i>check same</i><i class="danger">conflicting write</i></div>':''}
        </div>`;

    case 'locks':
      return `${statusScenario(edge,'consistent acquisition order','circular wait')}
        <div class="iv-locks">
          <div>${chip('T1')}${ivArrow()}${chip(data.t1||data.a||'A→B')}</div>
          <div>${chip('T2')}${ivArrow()}${chip(data.t2||data.b||'A→B',edge?'poor':'good')}</div>
          ${edge?'<strong class="iv-warning">cycle: each actor can wait for a resource held by the other</strong>':'<strong class="iv-ok">same order prevents this lock-order cycle</strong>'}
        </div>`;

    case 'capacity':
      return `${statusScenario(edge,'within concurrency budget','many requests wait behind fixed permits')}
        ${metricRows([['requests',data.requests||0],['permits / capacity',data.limit||data.capacity||0,'good'],['waiting',Math.max(0,(data.requests||0)-(data.limit||data.capacity||0)),edge?'poor':'']])}`;

    case 'pool':
      return `${statusScenario(edge,'small queue','large job burst')}
        <div class="iv-pool"><div class="iv-workers">${Array.from({length:Math.min(12,Number(data.workers||4))},(_,i)=>`<i>W${i+1}</i>`).join('')}</div>
        <div class="iv-jobline">${Array.from({length:Math.min(20,Number(data.jobs||0))},()=>'<b></b>').join('')}</div></div>
        <div class="iv-summary">${chip(`${data.workers||0} workers`,'good')}${chip(`${data.jobs||0} jobs`)}</div>`;

    case 'queue':
      return `${statusScenario(edge,'service rate ≥ arrival rate','arrival rate > service rate')}
        ${metricRows([['arrival / sec',data.arrival||0],['service / sec',data.service||0,'good'],['queue depth',data.depth||0,edge?'poor':'']])}
        <p class="viz-note">${edge?'Backlog grows while arrival exceeds sustainable service rate.':'The queue can absorb short bursts without persistent growth.'}</p>`;

    case 'tree-index': {
      const rows=Number(data.rows||0), matched=Number(data.matched||0);
      return `${statusScenario(edge,'selective query','query matches a large fraction of table')}
        <div class="iv-index-tree"><i>root</i><span></span><div><i>page</i><i>page</i><i>page</i></div><span></span><div class="leaves">${Array.from({length:8},(_,i)=>`<i class="${i<Math.max(1,Math.min(8,Math.ceil(matched/Math.max(rows,1)*8)))?'hit':''}"></i>`).join('')}</div></div>
        <div class="iv-summary">${chip(`${fmt(rows)} rows`)}${chip(`${fmt(matched)} matched`,edge?'poor':'good')}</div>`;
    }

    case 'query-plan':
      return `${statusScenario(edge,'estimates close to reality','cardinality estimate is badly wrong')}
        ${metricRows([['estimated rows',data.estimated||0],['actual rows',data.actual||0,edge?'poor':'good']])}
        <p class="viz-note">Large estimate errors can cascade into inappropriate join, scan or memory choices.</p>`;

    case 'versions':
      return `${statusScenario(edge,'few live row versions','version churn / long snapshots retain many versions')}
        <div class="iv-version-row">${Array.from({length:Math.min(20,Number(data.versions||1))},(_,i)=>`<i class="${i===Math.min(19,Number(data.versions||1)-1)?'current':''}">v${i+1}</i>`).join('')}</div>
        <div class="iv-summary">${chip(`${data.readers||0} readers`)}${chip(`${data.writers||0} writers`)}${chip(`${data.versions||0} versions`,edge?'poor':'good')}</div>`;

    case 'transactions':
      return `${statusScenario(edge,'transactions do not conflict','concurrent operations hit the same invariant')}
        <div class="iv-transactions"><div>T1 <span>read snapshot</span><span>write</span></div><div>T2 <span>read snapshot</span><span class="${edge?'conflict':''}">${edge?'serialization/conflict':'independent write'}</span></div></div>`;

    case 'partition':
      return `${statusScenario(edge,'partition pruning touches little data','query touches most partitions')}
        <div class="iv-partitions">${Array.from({length:Math.min(24,Number(data.partitions||1))},(_,i)=>`<i class="${i<Math.min(24,Math.ceil((data.touched||0)/Math.max(data.partitions||1,1)*24))?'hit':''}">P</i>`).join('')}</div>
        <div class="iv-summary">${chip(`${data.partitions||0} partitions`)}${chip(`${data.touched||0} touched`,edge?'poor':'good')}</div>`;

    case 'consensus': {
      const nodes=Number(data.nodes||5), available=Number(data.available||nodes), quorum=Number(data.quorum||Math.floor(nodes/2)+1);
      return `${statusScenario(edge,'quorum available','quorum unavailable')}
        <div class="iv-cluster">${Array.from({length:nodes},(_,i)=>`<i class="${i<available?'up':'down'}">N${i+1}</i>`).join('')}</div>
        <div class="iv-summary">${chip(`${available}/${nodes} reachable`,edge?'poor':'good')}${chip(`quorum = ${quorum}`)}</div>`;
    }

    case 'delivery':
      return `${statusScenario(edge,'one delivery, one effect','redelivery occurs after ambiguous failure')}
        <div class="iv-delivery">${box('broker deliveries',data.deliveries||1)}${ivArrow()}${box('business effects',data.sideEffects||1,(data.deliveries||1)===(data.sideEffects||1)?'':'deduplicated / idempotent','good')}</div>`;

    case 'replication':
      return `${statusScenario(edge,'replica caught up','replica lag exposes older version')}
        <div class="iv-replication">${box('primary',`v${data.writeVersion||0}`,'leader')}${ivArrow(`${data.lagMs||0}ms`)}${box('replica',`v${data.replicaVersion||0}`,edge?'stale':'current',edge?'poor':'good')}</div>`;

    case 'partition-network':
      return `${statusScenario(edge,'regions communicate','network link is partitioned')}
        <div class="iv-regions">${box('Region A','writes')}${ivArrow(edge?'×':'↔')}${box('Region B',edge?'unreachable':'replicating',edge?'poor':'good')}</div>
        <p class="viz-note">${edge?'A timeout cannot distinguish dead from unreachable; availability/consistency policy decides what can continue.':'Replication/coordination can proceed while the link is healthy.'}</p>`;

    case 'partitions':
      return `${statusScenario(edge,'key preserves entity-local order','events are spread without the needed ordering key')}
        <div class="iv-partition-log">${Array.from({length:Number(data.partitions||4)},(_,i)=>`<div><span>P${i}</span><i>1</i><i>2</i><i>3</i></div>`).join('')}</div>
        <div class="iv-summary">${chip(data.keyed?'stable key → local order':'no relevant key → related events may split',data.keyed?'good':'poor')}</div>`;

    case 'retry':
      return `${statusScenario(edge,'single bounded retry layer','nested retry multiplication')}
        ${metricRows([['retrying layers',data.layers||1],['retries / layer',data.retries||0],['possible attempts',data.multiplier||1,edge?'poor':'good']])}`;

    case 'protocol-stack':
      return `${statusScenario(edge,'handshake reaches application','failure occurs before HTTP')}
        <div class="iv-stack">${(data.steps||[]).map((step,i)=>`<div class="${edge&&i===2?'failed':''}"><span>${i+1}</span>${step}</div>`).join('')}</div>`;

    case 'multiplex':
      return `${statusScenario(edge,'multiple streams share a connection','loss affects transport differently')}
        <div class="iv-multiplex"><div class="iv-connection">${Array.from({length:Math.min(12,Number(data.streams||4))},(_,i)=>`<i>S${i+1}</i>`).join('')}</div>${edge&&data.loss?'<strong>packet loss</strong>':''}</div>`;

    case 'realtime':
      return `${statusScenario(edge,'one-way server push','bidirectional + datagram requirement')}
        <div class="iv-choice">${['SSE','WebSocket','WebTransport'].map(name=>`<div class="${String(data.choice||'').includes(name)?'selected':''}"><b>${name}</b><span>${name==='SSE'?'server → client':name==='WebSocket'?'↔ reliable messages':'↔ streams + datagrams'}</span></div>`).join('')}</div>`;

    case 'rpc':
      return `${statusScenario(edge,'one RPC inside deadline','many RPCs with little deadline remaining')}
        <div class="iv-rpc">${box('client stub',`${data.calls||1} call(s)`)}${ivArrow()}${box('HTTP/2 + protobuf',`${data.deadlineMs||0}ms deadline`,edge?'tight budget':'')}${ivArrow()}${box('server method','typed contract')}</div>`;

    case 'cache':
      return `${statusScenario(edge,'entry is fresh','entry is stale and must revalidate/refetch')}
        <div class="iv-cache">${box('max-age',`${data.freshSeconds||0}s`)}${ivArrow()}${box('age',`${data.age||0}s`,edge?'stale':'fresh',edge?'poor':'good')}${ivArrow()}${box('action',edge?'revalidate':'serve cache')}</div>`;

    case 'slo':
      return `${statusScenario(edge,'objective met','objective missed')}
        ${metricRows([['SLO target',data.target||0],['actual SLI',data.actual||0,edge?'poor':'good']])}
        <p class="viz-note">The error budget is the allowed unreliability between the objective and 100% over the defined window.</p>`;

    case 'latency':
      return `${statusScenario(edge,'healthy tail','tail latency dominates user experience')}
        ${metricRows([['p50 ms',data.p50||0],['p95 ms',data.p95||0],['p99 ms',data.p99||0,edge?'poor':'']])}`;

    case 'deadline':
      return `${statusScenario(edge,'deadline has useful budget remaining','almost all request budget is spent')}
        <div class="iv-deadline"><div class="iv-deadline-track"><i style="width:${Math.min(100,(data.spent||0)/Math.max(data.budget||1,1)*100)}%"></i></div>
        <div class="iv-summary">${chip(`${data.spent||0}ms spent`)}${chip(`${Math.max(0,(data.budget||0)-(data.spent||0))}ms left`,edge?'poor':'good')}</div></div>`;

    case 'breaker':
      return `${statusScenario(edge,'circuit closed','failure threshold opens circuit')}
        <div class="iv-breaker">${['closed','open','half-open'].map(s=>`<div class="${String(data.state).toLowerCase()===s?'selected':''}">${s}</div>`).join('')}</div>
        <div class="iv-summary">${chip(`${data.failures||0} recent failures`,edge?'poor':'')}</div>`;

    case 'telemetry':
      return `${statusScenario(edge,'signals share trace context','signals exist but cannot be correlated')}
        <div class="iv-telemetry">${['metrics','traces','logs'].map((x,i)=>`<div><b>${x}</b><span>${data.correlated?'trace_id=abc':`id=${i+1} unrelated`}</span></div>`).join('')}</div>`;

    case 'tests':
      return `${statusScenario(edge,'balanced portfolio','most coverage pushed into slow E2E')}
        <div class="iv-pyramid"><div style="--w:${data.e2e||0}%">E2E ${data.e2e||0}%</div><div style="--w:${data.integration||0}%">Integration ${data.integration||0}%</div><div style="--w:${data.unit||0}%">Unit ${data.unit||0}%</div></div>`;

    case 'contracts':
      return `${statusScenario(edge,'all consumers compatible','one consumer/provider contract breaks')}
        <div class="iv-contracts">${Array.from({length:Number(data.consumers||3)},(_,i)=>`<i class="${i<Number(data.compatible||0)?'good':'bad'}">C${i+1}</i>`).join('')}${ivArrow()}${box('provider','verified in CI')}</div>`;

    case 'property':
      return `${statusScenario(edge,'generated examples uphold invariant','generator finds a counterexample')}
        <div class="iv-property">${Array.from({length:Math.min(24,Math.max(4,Math.ceil((data.examples||20)/50)))},(_,i)=>`<i class="${edge&&i===5?'bad':'good'}"></i>`).join('')}</div>
        <div class="iv-summary">${chip(`${fmt(data.examples||0)} generated cases`)}${chip(`${data.failures||0} failures`,edge?'poor':'good')}</div>`;

    case 'signal':
      return `${statusScenario(edge,'CI red is trustworthy','flaky failures create alert fatigue')}
        ${metricRows([['test runs',data.runs||0],['random failures',data.randomFailures||0,edge?'poor':'good']])}`;

    case 'rollout':
      return `${statusScenario(edge,'canary remains healthy','canary metrics fail before wider exposure')}
        <div class="iv-rollout"><div class="iv-rollout-bar"><i class="${edge?'bad':'good'}" style="width:${Math.max(2,Number(data.percent||1))}%"></i></div>
        <div class="iv-summary">${chip(`${data.percent||0}% exposed`)}${chip(data.healthy?'healthy → continue':'unhealthy → stop / rollback',data.healthy?'good':'poor')}</div></div>`;

    case 'migration':
      return `${statusScenario(edge,'old and new versions coexist on compatible schema','new version expects destructive schema too early')}
        <div class="iv-migration">${['expand schema','deploy compatible code','backfill','switch','contract old'].map((x,i)=>`<div class="${edge&&i===4?'bad':i<4?'done':''}"><span>${i+1}</span>${x}</div>`).join('')}</div>`;
  }

  return `${statusScenario(edge,'normal case','stress case')}<div class="fallback-visual">${box('concept',pattern.title)}${ivArrow()}${box('outcome',edge?'failure mode exposed':'expected behavior')}</div>`;
}

function archNodeV(label, cls='', esc=(v)=>String(v)) {
  return `<div class="arch-node ${cls}">${esc(label)}</div>`;
}
function archConnectorV(label='→', animated=false) {
  return `<span class="arch-connector ${animated?'animated':''}">${label}</span>`;
}

export function renderArchitectureVisual(pattern, scenario='normal', esc=(v)=>String(v)) {
  const stressed = scenario === 'edge';
  const N = (label, cls='') => archNodeV(label, cls, esc);
  const C = (label='→', animated=false) => archConnectorV(label, animated);
  switch (pattern.viz) {
    case 'arch-monolith':
      return `<div class="deploy-boundary ${stressed?'stress':''}"><span>one deployable</span><div class="module-grid">${['Orders','Payments','Inventory','Users'].map(x=>N(x)).join('')}</div></div><p class="viz-note">${stressed?'Stress case: one hot module can force scaling the whole deployable. Strong internal boundaries still keep extraction possible.':'Modules share a process/deployment boundary but communicate through explicit contracts.'}</p>`;
    case 'arch-microservices':
      return `<div class="arch-row center">${N('Client')}${C()}${N('Gateway','dark')}</div><div class="service-grid">${['Orders','Payments','Inventory'].map((x,i)=>`<div>${N(x,stressed&&i===1?'stress':'')}${C('↓',true)}${N(x+' DB','data')}</div>`).join('')}</div><p class="viz-note">${stressed?'Payments is failing: callers need timeouts, isolation and observability across service boundaries.':'Each service owns deployment and data; the price is distributed coordination.'}</p>`;
    case 'arch-event':
      return `<div class="arch-row center producers">${N('Producer A')}${N('Producer B')}</div>${C('↓',true)}<div class="broker ${stressed?'stress':''}">Event broker <i></i></div>${C('↓',true)}<div class="arch-row center consumers">${N('Email')}${N('Analytics')}${N('Loyalty')}</div><p class="viz-note">${stressed?'Stress case: one consumer is offline. Durable delivery, retries and replay policy decide what happens next.':'Producers publish facts without knowing every consumer.'}</p>`;
    case 'arch-queue':
      return `<div class="arch-row center">${N('Web')}${C()}${N(stressed?'Queue: backlog ↑':'Queue','queue')}${C()}${N(stressed?'Workers × 4':'Workers × 2','worker')}</div><div class="queue-dots">${Array.from({length:stressed?14:6},()=>'<i></i>').join('')}</div><p class="viz-note">The queue absorbs bursts; worker capacity determines drain rate.</p>`;
    case 'arch-sync-async':
      return `<div class="two-lanes"><div><strong>Synchronous path</strong><div class="arch-row">${N('Client')}${C()}${N('Decision')}${C()}${N('Response')}</div></div><div><strong>Asynchronous continuation</strong><div class="arch-row">${N('Event')}${C()}${N('Broker')}${C()}${N(stressed?'Consumer retry':'Consumer')}</div></div></div>`;
    case 'arch-compute':
      return `<div class="compute-grid">${[['VM','host control','you manage OS/runtime'],['Container','portable service','you manage image/orchestration'],['Function','event/request','provider manages servers']].map(([a,b,d],i)=>`<div class="${stressed&&i===2?'stress':''}"><b>${a}</b><span>${b}</span><small>${d}</small></div>`).join('')}</div><p class="viz-note">${stressed?'Stress case: a long-running/high-utilization workload can make per-invocation serverless economics or limits unattractive.':'Choose by workload shape, control needs and operations—not by platform fashion.'}</p>`;
    case 'arch-serverless':
      return `<div class="arch-row center">${N('Event')}${C('',true)}${N('Function','function')}${C()}${N('Managed state','data')}${C()}${N('Next event')}</div><p class="viz-note">${stressed?'Failure/duplicate case: idempotency and durable orchestration decide whether repeated delivery is safe.':'Short-lived compute reacts to events while durable state lives outside the runtime.'}</p>`;
    case 'arch-k8s':
      return `<div class="k8s-box"><div class="control-plane">control plane · desired state</div><div class="node-grid">${[['Deployment','API replicas'],['StatefulSet','stable identity'],['DaemonSet','node agent'],['Job','run to completion']].map(([a,b])=>`<div><b>${a}</b><span>${b}</span></div>`).join('')}</div></div><p class="viz-note">${stressed?'A node disappears: controllers create replacement Pods according to workload semantics; durable storage/identity still need design.':'The controller contract—not the container image—defines lifecycle behavior.'}</p>`;
    case 'arch-state':
      return `<div class="state-compare"><div><b>Accidental local state</b>${N('Replica A: session')}${N(stressed?'Replica B: missing':'Replica B')}</div><div><b>External durable state</b><div class="arch-row">${N('Replica A')}${N('Replica B')}</div>${C('↓')}${N('Shared state','data')}</div></div>`;
    case 'arch-cqrs':
      return `<div class="cqrs"><div class="arch-row">${N('Command')}${C()}${N('Write model')}${C()}${N('Write store','data')}</div><div class="projection-arrow">${C('events / replication',true)}</div><div class="arch-row">${N('Query')}${C()}${N(stressed?'Read model: lagging':'Read model')}${C()}${N('Read store','data')}</div></div><p class="viz-note">The key trade-off is independent optimization versus synchronization/freshness complexity.</p>`;
    case 'arch-event-source':
      return `<div class="event-stream">${['OrderCreated','PaymentCaptured','Packed','Shipped'].map((x,i)=>`<div class="${stressed&&i===3?'stress':''}"><span>${i+1}</span>${x}</div>`).join('')}</div>${C('↓ replay / project',true)}${N(stressed?'Projection needs rebuild':'Current order: SHIPPED','data')}`;
    case 'arch-gateway':
      return `<div class="arch-row center clients">${N('Web')}${N('Mobile')}</div>${C('↓')}<div class="gateway ${stressed?'stress':''}">Gateway / BFF</div>${C('↓')}<div class="service-grid small">${['Orders','Users','Search'].map(x=>N(x)).join('')}</div><p class="viz-note">${stressed?'Risk: domain logic accumulates here and turns the gateway into a new monolith.':'Keep edge composition/policy here; keep domain ownership behind it.'}</p>`;
    case 'arch-batch-stream':
      return `<div class="two-lanes"><div><strong>Batch</strong><div class="batch-box">${Array.from({length:8},()=>'<i></i>').join('')}<span>schedule → process chunk</span></div></div><div><strong>Stream</strong><div class="stream-box">${Array.from({length:8},()=>'<i></i>').join('')}<span>continuous events → continuous reaction</span></div></div></div><p class="viz-note">${stressed?'Late/out-of-order events force explicit event-time and replay rules in streaming systems.':'Start from freshness requirements; many mature systems use both.'}</p>`;
    case 'arch-cache':
      return `<div class="cache-flow"><div class="arch-row">${N('Request')}${C()}${N(stressed?'Cache MISS':'Cache HIT','cache')}${C()}${N(stressed?'Database':'Return','data')}</div>${stressed?'<div class="stampede">many simultaneous misses → origin pressure</div>':''}</div>`;
    case 'arch-big-compute':
      return `<div class="compute-fan"><div class="coordinator">partition</div>${C('↓',true)}<div class="worker-grid">${Array.from({length:8},(_,i)=>`<i class="${stressed&&i>4?'idle':''}">W${i+1}</i>`).join('')}</div>${C('↓ reduce')}<div class="coordinator">result</div></div><p class="viz-note">${stressed?'Serial work and communication cap speedup even when more workers exist.':'Parallel resources help only when enough useful work can run independently.'}</p>`;
    case 'arch-scale':
      return `<div class="scale-compare"><div><strong>Scale up</strong><div class="server tall">bigger server</div></div><div><strong>Scale out</strong><div class="replicas">${Array.from({length:stressed?6:3},()=>'<div class="server">replica</div>').join('')}</div></div></div><p class="viz-note">Horizontal scale adds distribution and state questions; vertical scale keeps a larger single failure domain.</p>`;
    default:
      return `<div class="arch-row center">${N('Input')}${C('',true)}${N('Boundary')}${C()}${N(stressed?'Failure path':'Outcome')}</div>`;
  }
}
