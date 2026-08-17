const assert = require('assert');
const {
  binkiUserscriptPromiseRaceAbortSettle,
  BinkiUserscriptPromiseRaceAbortSettleAborted,
} = require('../binki-userscript-promise-race-abort-settle.js');

describe('binkiUserscriptPromiseRaceAbortSettle', () => {
  it('should throw the same as Promise.any() if empty array passed', async () => {
    const promise = binkiUserscriptPromiseRaceAbortSettle([]);
    const results = await Promise.allSettled([promise, Promise.any([])]);
    assert.strictEqual(results[0].status, 'rejected');
    assert.strictEqual(results[0].reason.toString(), results[1].reason.toString());
    assert.strictEqual(results[0].reason.message, results[1].reason.message);
  });

  it('should throw TypeError if an element in funcAsyncs is not a function', async () => {
    let thrownEx;
    try {
      await binkiUserscriptPromiseRaceAbortSettle([Promise.resolve(1)]);
    } catch (ex) {
      thrownEx = ex;
    }
    assert.ok(thrownEx);
    assert.ok(thrownEx instanceof TypeError);
  });

  it('should resolve to an already-resolved single Promise', async () => {
    assert.strictEqual(await binkiUserscriptPromiseRaceAbortSettle([signal => {
      return Promise.resolve(1);
    }]), 1);
  });

  it('should reject if any of the Promises are rejected', async () => {
    let thrownEx;
    try {
      await binkiUserscriptPromiseRaceAbortSettle([signal => Promise.resolve(1), signal => Promise.reject('hi')]);
    } catch (ex) {
      thrownEx = ex;
    }
    assert.ok(thrownEx);
    assert.strictEqual(thrownEx, 'hi');
  });

  it('should resolve to the first Promise which resolves', async () => {
    let resolve1;
    let resolve2;
    assert.strictEqual(await binkiUserscriptPromiseRaceAbortSettle([signal => new Promise(resolve => {
      resolve1 = resolve;
    }), signal => new Promise(resolve => {
      resolve2 = resolve;
    }), signal => new Promise(resolve => {
      setTimeout(() => {
        resolve(3);
        setTimeout(() => {
          resolve2(2);
          resolve1(1);
        }, 0);
      }, 0);
    })]), 3);
  });

  it('should abort the signal for outstanding operations when one finishes', async () => {
    let abortWitnessed;
    assert.strictEqual(await binkiUserscriptPromiseRaceAbortSettle([signal => new Promise((resolve, reject) => {
      signal.addEventListener('abort', e => {
        reject(signal.reason);
        abortWitnessed = true;
      });
    }), async signal => {
      return 2;
    }]), 2);
    assert.ok(abortWitnessed);
  });

  it('should use BinkiUserscriptPromiseRaceAbortSettleAborted for the reason', async () => {
    let seenReason;
    assert.strictEqual(await binkiUserscriptPromiseRaceAbortSettle([signal => new Promise((resolve, reject) => {
      signal.addEventListener('abort', e => {
        reject(signal.reason);
        seenReason = signal.reason;
      });
    }), async signal => {
      return 2;
    }]), 2);
    assert.ok(seenReason);
    assert.ok(seenReason instanceof BinkiUserscriptPromiseRaceAbortSettleAborted);
  });

  it('should use see an external passed in signal’s reason', async () => {
    const abortController = new AbortController();
    let seenReason;
    let seenEx;
    try {
      await binkiUserscriptPromiseRaceAbortSettle([signal => new Promise((resolve, reject) => {
        signal.addEventListener('abort', e => {
          reject(signal.reason);
          seenReason = signal.reason;
        });
      }), signal => new Promise((resolve, reject) => {
        signal.addEventListener('abort', e => {
          reject(signal.reason);
        });
        abortController.abort('hello 25');
      })], abortController.signal);
  } catch (ex) {
    seenEx = ex;
  }
    assert.ok(seenReason);
    assert.strictEqual(seenReason, 'hello 25');
    assert.ok(seenEx);
    assert.strictEqual(seenEx, 'hello 25');
  });
});
