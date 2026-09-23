import assert from 'node:assert/strict';
import {renderBrowserMetrics} from './resource-visuals.js';

const base={
  ok:true,
  duration:12,
  eventLoopDelay:1.5,
  realm:'browser-main-thread',
  domNodeDelta:0,
  mutations:0,
  longTaskCount:0,
  longTaskMs:0
};

const withoutHeap=renderBrowserMetrics(base);
assert.doesNotMatch(withoutHeap,/JS heap|performance\.memory/,'unsupported heap data must not render a heap card');

const withHeap=renderBrowserMetrics({
  ...base,
  memoryBefore:{usedJSHeapSize:1024},
  memoryAfter:{usedJSHeapSize:2048}
});
assert.match(withHeap,/JS heap delta/,'supported heap data should render the delta');
assert.match(withHeap,/JS heap after/,'supported heap data should render the ending value');

console.log('Resource visual contracts passed.');
