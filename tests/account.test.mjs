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
  applySessionPriceBook,
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

test('applySessionPriceBook emits the price book for the session group', async () => {
  const emitted = [];
  const events = { emit: (name, data) => emitted.push([name, data]) };
  const storage = fakeStorage();
  await applySessionPriceBook({ storage, events });
  setSession({ token: 't', expiresIn: 60, shopper: { ...shopper, group: 'member' } }, storage);
  await applySessionPriceBook({ storage, events });
  setSession({ token: 't', expiresIn: 60, shopper: { ...shopper, group: 'wholesale' } }, storage);
  await applySessionPriceBook({ storage, events });
  assert.deepEqual(emitted, [
    ['auth/adobe-commerce-optimizer', { priceBookId: 'guest' }],
    ['auth/adobe-commerce-optimizer', { priceBookId: 'member' }],
    ['auth/adobe-commerce-optimizer', { priceBookId: 'guest' }],
  ]);
});

function apiStub({ apiBase = 'https://api.example', respond } = {}) {
  const calls = [];
  const fetchFn = async (url, init) => {
    if (url === '/config.json') {
      return { ok: true, json: async () => ({ public: { default: { 'shopper-api': apiBase, 'demo-id': 'd1' } } }) };
    }
    calls.push({ url, init });
    return respond ? respond(url, init) : { ok: true, status: 200, json: async () => ({ ok: 1 }) };
  };
  return { fetchFn, calls };
}

test('accountApi POST builds the exact URL, JSON body with demoId, and no Authorization', async () => {
  const cases = [
    ['https://api.example', '/shopper/signup'],
    ['https://api.example/', '/shopper/signup'],
    ['https://api.example//', 'shopper/signup'],
  ];
  for (const [apiBase, path] of cases) {
    const { fetchFn, calls } = apiStub({ apiBase });
    // eslint-disable-next-line no-await-in-loop
    await accountApi(path, {
      method: 'POST', body: { email: 'a@b.co' }, fetchFn, storage: fakeStorage(),
    });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://api.example/shopper/signup');
    assert.equal(calls[0].init.method, 'POST');
    assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
    assert.equal(calls[0].init.headers.Authorization, undefined);
    assert.deepEqual(JSON.parse(calls[0].init.body), { email: 'a@b.co', demoId: 'd1' });
  }
});

test('accountApi GET puts demoId in the query string, not a body', async () => {
  const { fetchFn, calls } = apiStub();
  await accountApi('/shopper/membership', { fetchFn, storage: fakeStorage() });
  assert.equal(calls[0].url, 'https://api.example/shopper/membership?demoId=d1');
  assert.equal(calls[0].init.body, undefined);
});

test('accountApi auth:true sends the bearer token', async () => {
  const { fetchFn, calls } = apiStub();
  const storage = fakeStorage();
  setSession({ token: 'tok', expiresIn: 60, shopper }, storage);
  await accountApi('/shopper/me', { auth: true, fetchFn, storage });
  assert.equal(calls[0].init.headers.Authorization, 'Bearer tok');
});

test('accountApi auth:true without a session throws 401 and makes no API call', async () => {
  const { fetchFn, calls } = apiStub();
  await assert.rejects(
    () => accountApi('/shopper/me', { auth: true, fetchFn, storage: fakeStorage() }),
    (e) => e instanceof Error && e.status === 401,
  );
  assert.equal(calls.length, 0);
});

test('accountApi surfaces the service error message and HTTP status', async () => {
  const { fetchFn } = apiStub({
    respond: async () => ({ ok: false, status: 409, json: async () => ({ error: 'msg' }) }),
  });
  await assert.rejects(
    () => accountApi('/shopper/signup', { method: 'POST', body: {}, fetchFn }),
    (e) => e instanceof Error && e.message === 'msg' && e.status === 409,
  );
});

test('accountApi keeps the HTTP status when the error body is null', async () => {
  const { fetchFn } = apiStub({
    respond: async () => ({ ok: false, status: 500, json: async () => null }),
  });
  await assert.rejects(
    () => accountApi('/shopper/signup', { method: 'POST', body: {}, fetchFn }),
    (e) => e instanceof Error && e.status === 500 && e.message === 'Something went wrong',
  );
});

test('safeReturnPath rejects whitespace-then-double-slash and accepts an encoded backslash', () => {
  assert.equal(safeReturnPath('/ \t//evil.com'), '/account');
  assert.equal(safeReturnPath('/%5Cevil.com'), '/%5Cevil.com');
});
