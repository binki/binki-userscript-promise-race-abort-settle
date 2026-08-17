## Usage

Include this in your userscript using [`@require`](https://wiki.greasespot.net/Metadata_Block#.40require). It is recommended to [use a permalink](https://docs.github.com/en/repositories/working-with-files/using-files/getting-permanent-links-to-files) instead of referring to `master`.

```js
// ==UserScript==
// @name example
// @version 1.0.0
// @require https://github.com/binki/binki-userscript-promise-race-abort-settle/raw/master/binki-userscript-promise-race-abort-settle.js
// ==UserScript==

(async () => {
  // Get the first value that becomes available.
  const value = await binkiUserscriptPromiseRaceAbortSettle([signal => new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const timeoutId = setTimeout(() => {
      signal.removeEventListener('abort', abortHandler);
      resolve(1);
    }, 100);
    const abortHandler = () => {
      clearTimeout(timeoutId);
      reject(signal.reason);
    };
    signal.addEventListener('abort', abortHandler);
  }), signal => new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const timeoutId = setTimeout(() => {
      signal.removeEventListener('abort', abortHnalder);
      resolve(2);
    }, 100);
    const abortHandler = () => {
      clearTimeout(timeoutId);
      reject(signal.reason);
    };
    signal.addEventListener('abort', abortHandler);
  })]);
  console.log('value', value);
})();
```

## API

```js
binkiUserscriptPromiseRaceAbortSettleAborted(funcAsyncs, signal);
```

Parameters:

* `funcAsyncs` is an iterable of at least one `function(signal):Promise`. Each function is invoked accepting [`AbortSignal`](https://dom.spec.whatwg.org/#interface-AbortSignal). This `AbortSignal` is aborted with a a `reason` of an instance of `BinkiUserscriptPromiseRaceAbortSettleAborted` once at least one of the functions resolves its returned `Promise`. If the `signal` parameter passed in is aborted prior to any functions resolving, then the passed in `AbortSignal` is aborted with the same reason.
* `signal` is an optional [`AbortSignal`](https://dom.spec.whatwg.org/#abortsignal) which can be used to request early termination.

Returns:

A `Promise`.

* If `funcAsyncs` is an empty iteration, the `Promise` is rejected with the same reason as `Promise.any([])`.
* If any of the `Promise` returned by one of the `funcAsyncs` is rejected with a reason other than the instance of `BinkiUserscriptPromiseRaceAbortSettleAborted` created and passed in through the `AbortSignal.reason`, this `Promise` is rejected with that reason.
* The `Promise` is resolved with one of the resolutions from any of the `Promise` instances returned by any of `funcAsyncs`.
