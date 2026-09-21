# SWE Revision Labs — JavaScript

A mobile-first JavaScript revision application covering the language from primitives through closures, prototypes, promises and memory management, then showing how the same language runs in browser and Node.js hosts.

## Source policy

- **MDN Web Docs** is the sole source for JavaScript language semantics, browser APIs and browser debugging/performance guidance.
- **Official Node.js documentation** is the sole additional source for Node-specific APIs, runtime behavior, debugging and process/OS metrics.
- Every lesson displays its direct reference URL.

## Curriculum

The app contains more than 100 individually indexed lessons across language foundations, control flow, functions/closures, objects/prototypes/classes, collections, iterators/generators, promises/execution model, modules/resources, memory/metaprogramming, browser runtime behavior, Node runtime/OS resources, and an advanced debugging section.

## Runnable JavaScript

Core JavaScript examples run inside a disposable Web Worker with a timeout. Browser-specific examples run inside a sandboxed iframe with a restrictive CSP.

The browser runner reports only values actually observed during execution, including:

- wall-clock duration from `performance.now()`
- event-loop/timer delay caused by the executed snippet
- DOM-node delta and child-list mutations for browser/DOM examples
- long-task count/time when the browser exposes the Long Tasks performance entry type
- browser-exposed JS heap readings when the browser exposes them

No synthetic “resource pressure” scores are shown.

## Actual Node resource measurements

GitHub Pages cannot execute Node.js or read OS process counters. Node lessons therefore generate an official-API probe that you run in your real Node process and paste back into the app. The resulting visualizer uses only the imported measurements:

- `process.memoryUsage()` — RSS, V8 heap, external memory and ArrayBuffer memory
- `process.cpuUsage()` — user/system CPU time
- `process.resourceUsage()` — max RSS, page faults, filesystem counters and context switches
- `performance.eventLoopUtilization()` — event-loop active/idle utilization
- wall-clock duration from `node:perf_hooks`

## Advanced debugging labs

The debugging track contains multi-step, advanced diagnostic questions covering async ordering, stale closures, promise ownership, stack overflow, browser main-thread stalls, DOM/listener retention, Node event-loop saturation, RSS-vs-heap discrepancies, stream backpressure and diagnostic reports.

The flow is: symptom → inspect code → choose the next diagnostic action → reveal root cause → run/measure where possible → compare the fix.

## State model

Meaningful user state is centralized through `state-model.js` and reducer-style transitions. Persisted data is normalized against current lesson/topic IDs before use. Code edits, progress, mastery state, browser measurements, imported Node measurements and debugging progress are persisted consistently.

## Local development

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Deployment

Pushes to `main` deploy through GitHub Pages.

Live site: `https://hexrift.github.io/swe-revision-labs/`