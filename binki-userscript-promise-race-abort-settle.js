/**
 * @param funcAsyncs{Array<function(AbortSignal):Promise<Object>>} The Promise factories accepting an {@link external:AbortSignal}. If {@link signal} is provided, the passed-in {@link external:AbortSignal} may abort for the same reason as {@link signal}. Once the first Promise resolves, the {@link external:AbortSignal} will be rejected with a reason of {@link external:BinkiUserscriptPromiseRaceAbortSettleAborted}.
 * @param signal{AbortSignal} (Optional) If supplied, a causes early termination.
 * @returns Promise<Object> A Promise resolving to the the resolved value of the first resolving Promise returned by one of the functions specified in {@link funcAsyncs}. If {@link funcAsyncs} is empty, rejects the same way as {@link external:Promise.any}.
 */
const binkiUserscriptPromiseRaceAbortSettle = (funcAsyncs, signal) => {
  funcAsyncs = [...funcAsyncs];
  if (!funcAsyncs.length) {
    return Promise.any([]);
  }
  const abortController = new AbortController();
  const abortHandler = signal ? e => abortController.abort(signal.reason) : null;
  if (signal !== undefined) {
    if (signal.aborted) {
      return Promise.reject(signal.reason);
    }
    signal.addEventListener('abort', abortHandler);
  }
  return (async () => {
    const promises = [];
    try {
      for (const funcAsync of funcAsyncs) {
        promises.push(funcAsync(abortController.signal));
      }
      return await await Promise.race(promises);
    } finally {
      try {
        if (abortHandler) {
          signal.removeEventListener('abort', abortHandler);
        }
      } finally {
        if (!abortController.signal.aborted) {
          abortController.abort(new BinkiUserscriptPromiseRaceAbortSettleAborted());
        }
        for (const result of await Promise.allSettled(promises)) {
          if (result.status === 'rejected' && result.reason !== abortController.signal.reason) {
            throw result.reason;
          }
        }
      }
    }
  })();
};

class BinkiUserscriptPromiseRaceAbortSettleAborted extends Error {
}

if (typeof module !== 'undefined') {
  module.exports = {
    binkiUserscriptPromiseRaceAbortSettle,
    BinkiUserscriptPromiseRaceAbortSettleAborted,
  };
}
