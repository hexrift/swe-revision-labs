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
