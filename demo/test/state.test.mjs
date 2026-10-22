import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diff } from '../lib/state.mjs';

const items = [
  { key: 'a', hash: '1', value: 'A' },
  { key: 'b', hash: '2', value: 'B' },
];

test('diff: everything changed against empty state', () => {
  assert.deepEqual(diff(undefined, items), { changed: ['A', 'B'], unchanged: 0, removedKeys: [] });
});

test('diff: changed, unchanged and removed', () => {
  const r = diff({ a: '1', b: 'old', gone: '9' }, items);
  assert.deepEqual(r, { changed: ['B'], unchanged: 1, removedKeys: ['gone'] });
});

test('diff: nothing to do when identical', () => {
  assert.deepEqual(diff({ a: '1', b: '2' }, items), { changed: [], unchanged: 2, removedKeys: [] });
});

test('diff: force resends everything but still reports removals', () => {
  const r = diff({ a: '1', b: '2', gone: '9' }, items, { force: true });
  assert.deepEqual(r, { changed: ['A', 'B'], unchanged: 0, removedKeys: ['gone'] });
});
