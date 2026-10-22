import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  chunk, sendInBatches, MAX_ITEMS, MAX_BYTES,
} from '../lib/batch.mjs';

test('chunk: empty input gives no batches', () => {
  assert.deepEqual(chunk([]), []);
});

test('chunk: splits at 100 items', () => {
  const items = Array.from({ length: 250 }, (_, i) => ({ i }));
  const batches = chunk(items);
  assert.deepEqual(batches.map((b) => b.length), [100, 100, 50]);
  assert.equal(MAX_ITEMS, 100);
  assert.deepEqual(batches.flat(), items);
});

test('chunk: splits at the byte limit', () => {
  const big = (i) => ({ i, pad: 'x'.repeat(60 * 1024) });
  const items = Array.from({ length: 7 }, (_, i) => big(i));
  const batches = chunk(items);
  assert.ok(batches.length > 1);
  for (const b of batches) {
    assert.ok(b.length > 0);
    assert.ok(Buffer.byteLength(JSON.stringify(b)) <= MAX_BYTES);
  }
  assert.deepEqual(batches.flat(), items);
});

test('chunk: oversized single item gets its own batch, never empty batches', () => {
  const huge = { pad: 'x'.repeat(MAX_BYTES + 10) };
  const batches = chunk([{ a: 1 }, huge, { b: 2 }]);
  assert.deepEqual(batches, [[{ a: 1 }], [huge], [{ b: 2 }]]);
  assert.ok(batches.every((b) => b.length > 0));
});

test('chunk: custom limits', () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], { maxItems: 2 }).map((b) => b.length), [2, 2, 1]);
});

test('sendInBatches: sums acceptedCount and returns totals', async () => {
  const items = Array.from({ length: 101 }, (_, i) => ({ i }));
  const calls = [];
  const send = async (batch) => {
    calls.push(batch.length);
    return { ok: true, status: 202, data: { acceptedCount: batch.length - 1 } };
  };
  const logs = [];
  const r = await sendInBatches('products', items, send, { log: (m) => logs.push(m) });
  assert.deepEqual(calls, [100, 1]);
  assert.deepEqual(r, { sent: 101, accepted: 99, batches: 2 });
  assert.equal(logs.length, 2);
});

test('sendInBatches: falls back to batch length when acceptedCount missing', async () => {
  const r = await sendInBatches('x', [1, 2, 3], async () => ({ ok: true, status: 200 }), { log: () => {} });
  assert.equal(r.accepted, 3);
});

test('sendInBatches: throws a useful message on ok:false', async () => {
  const send = async () => ({
    ok: false, status: 403, statusText: 'Forbidden', data: { message: 'nope' },
  });
  await assert.rejects(
    sendInBatches('prices', [1], send, { log: () => {} }),
    (e) => /prices batch 1\/1 failed: 403 Forbidden/.test(e.message) && e.message.includes('nope'),
  );
});

test('sendInBatches: no items sends nothing', async () => {
  let called = false;
  const r = await sendInBatches('x', [], async () => { called = true; }, { log: () => {} });
  assert.equal(called, false);
  assert.deepEqual(r, { sent: 0, accepted: 0, batches: 0 });
});
