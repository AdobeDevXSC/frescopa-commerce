import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SESSION_KEY,
  getSession,
  setSession,
  clearSession,
  priceBookFor,
  safeReturnPath,
  getAccountConfig,
  accountApi,
} from '../scripts/account.js';

function fakeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

const shopper = {
  shopperId: 's1', email: 'a@b.co', name: 'Ada', group: 'guest',
};

test('getSession returns null when empty, malformed JSON or expired', () => {
  const s = fakeStorage();
  assert.equal(getSession(s, 1000), null);
  s.setItem(SESSION_KEY, '{not json');
  assert.equal(getSession(s, 1000), null);
  s.setItem(SESSION_KEY, JSON.stringify({ token: 't', expiresAt: 500, shopper }));
  assert.equal(getSession(s, 1000), null);
  s.setItem(SESSION_KEY, JSON.stringify({ expiresAt: 5000 }));
  assert.equal(getSession(s, 1000), null);
});

test('setSession then getSession round-trips and computes expiresAt from expiresIn', () => {
  const s = fakeStorage();
  setSession({ token: 't', expiresIn: 3600, shopper }, s, 1000);
  const got = getSession(s, 2000);
  assert.equal(got.token, 't');
  assert.equal(got.expiresAt, 1000 + 3600 * 1000);
  assert.deepEqual(got.shopper, shopper);
});

test('clearSession removes it', () => {
  const s = fakeStorage();
  setSession({ token: 't', expiresIn: 60, shopper }, s, 0);
  clearSession(s);
  assert.equal(getSession(s, 1), null);
});

test('priceBookFor: member -> member; guest, wholesale, retail, undefined -> guest', () => {
  assert.equal(priceBookFor('member'), 'member');
  ['guest', 'wholesale', 'retail', undefined].forEach((g) => {
    assert.equal(priceBookFor(g), 'guest');
  });
});

test('safeReturnPath accepts same-origin paths and rejects the rest', () => {
  assert.equal(safeReturnPath('/products/x?y=1'), '/products/x?y=1');
  ['//evil.com', 'https://evil.com', '/\\evil.com', 'javascript:alert(1)', '', null].forEach((v) => {
    assert.equal(safeReturnPath(v), '/account');
  });
  assert.equal(safeReturnPath(null, '/home'), '/home');
});

test('getAccountConfig throws a clear error when demo-id is missing', async () => {
  const fetchFn = async () => ({
    ok: true,
    json: async () => ({ public: { default: { 'shopper-api': 'https://api.example' } } }),
  });
  await assert.rejects(() => getAccountConfig(fetchFn), /demo-id is not configured/);
});

test('getAccountConfig reads shopper-api and demo-id', async () => {
  const fetchFn = async () => ({
    ok: true,
    json: async () => ({ public: { default: { 'shopper-api': 'https://api.example/', 'demo-id': 'd1' } } }),
  });
  assert.deepEqual(await getAccountConfig(fetchFn), { apiBase: 'https://api.example', demoId: 'd1' });
});

test('accountApi sends demoId in the body and the bearer token, and surfaces errors', async () => {
  const calls = [];
  const fetchFn = async (url, init) => {
    calls.push({ url, init });
    if (url.includes('/config.json')) {
      return { ok: true, json: async () => ({ public: { default: { 'shopper-api': 'https://api.example', 'demo-id': 'd1' } } }) };
    }
    if (url.includes('bad')) return { ok: false, status: 409, json: async () => ({ error: 'Email exists' }) };
    return { ok: true, status: 200, json: async () => ({ ok: 1 }) };
  };
  const storage = fakeStorage();
  setSession({ token: 'tok', expiresIn: 60, shopper }, storage);
  const res = await accountApi('/shopper/me', { auth: true, fetchFn, storage });
  assert.deepEqual(res, { ok: 1 });
  const call = calls.find((c) => c.url.startsWith('https://api.example/shopper/me'));
  assert.ok(call.url.includes('demoId=d1'));
  assert.equal(call.init.headers.Authorization, 'Bearer tok');
  const post = await accountApi('/shopper/login', { method: 'POST', body: { email: 'x' }, fetchFn, storage });
  assert.deepEqual(post, { ok: 1 });
  const p = calls.filter((c) => c.init?.method === 'POST')[0];
  assert.deepEqual(JSON.parse(p.init.body), { email: 'x', demoId: 'd1' });
  await assert.rejects(
    () => accountApi('/bad', { method: 'POST', body: {}, fetchFn, storage }),
    (e) => e.status === 409 && e.message === 'Email exists',
  );
});
