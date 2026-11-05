/**
 * Demo accounts: session handling and calls to frescopa-demo-services.
 * Import-safe: nothing here touches the browser at module load.
 */

export const SESSION_KEY = 'frescopa-account';

function defaultStorage() {
  try {
    return sessionStorage;
  } catch (e) {
    return null;
  }
}

export function getSession(storage = defaultStorage(), now = Date.now()) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session || typeof session.token !== 'string' || !session.shopper) return null;
    if (typeof session.expiresAt !== 'number' || session.expiresAt <= now) return null;
    return session;
  } catch (e) {
    return null;
  }
}

export function setSession(
  { token, expiresIn, shopper },
  storage = defaultStorage(),
  now = Date.now(),
) {
  if (!storage) return;
  const session = { token, expiresAt: now + expiresIn * 1000, shopper };
  try {
    storage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    // storage unavailable: the visitor simply stays signed out
  }
}

export function clearSession(storage = defaultStorage()) {
  if (!storage) return;
  try {
    storage.removeItem(SESSION_KEY);
  } catch (e) {
    // ignore
  }
}

export function priceBookFor(group) {
  return group === 'member' ? 'member' : 'guest';
}

export function safeReturnPath(value, fallback = '/account') {
  if (typeof value !== 'string' || !value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  if (value.includes('\\')) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}

export async function getAccountConfig(fetchFn = (...args) => fetch(...args)) {
  const resp = await fetchFn('/config.json');
  if (!resp.ok) throw new Error('Could not load site configuration');
  const json = await resp.json();
  const cfg = json?.public?.default || {};
  const apiBase = cfg['shopper-api'];
  const demoId = cfg['demo-id'];
  if (!apiBase) throw new Error('shopper-api is not configured');
  if (!demoId) throw new Error('demo-id is not configured');
  return { apiBase: String(apiBase).replace(/\/+$/, ''), demoId };
}

export async function accountApi(path, options = {}) {
  const {
    method = 'GET', body, auth = false, fetchFn = (...args) => fetch(...args), storage,
  } = options;
  const { apiBase, demoId } = await getAccountConfig(fetchFn);
  const headers = { Accept: 'application/json' };
  const init = { method, headers };
  let url = `${apiBase}${path}`;
  if (method === 'GET') {
    url += `${url.includes('?') ? '&' : '?'}demoId=${encodeURIComponent(demoId)}`;
  } else {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify({ ...body, demoId });
  }
  if (auth) {
    const session = getSession(storage);
    if (!session) {
      const err = new Error('Please sign in');
      err.status = 401;
      throw err;
    }
    headers.Authorization = `Bearer ${session.token}`;
  }
  const resp = await fetchFn(url, init);
  let data = {};
  try {
    data = await resp.json();
  } catch (e) {
    data = {};
  }
  if (!resp.ok) {
    const err = new Error(data.error || 'Something went wrong');
    err.status = resp.status;
    throw err;
  }
  return data;
}

export async function applySessionPriceBook() {
  const session = getSession();
  if (!session) return;
  const { events } = await import('@dropins/tools/event-bus.js');
  events.emit('auth/adobe-commerce-optimizer', {
    priceBookId: priceBookFor(session.shopper.group),
  });
}
