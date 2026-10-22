// Per-tenant record of what was last synced (sku → hash), so re-runs only send changes and --prune
// knows which demo SKUs disappeared. Stored in demo/.state/<tenant>.json (gitignored).
import {
  readFileSync, writeFileSync, mkdirSync, existsSync,
} from 'node:fs';
import path from 'node:path';
import { DEMO_DIR } from './config.mjs';

const file = (tenantId) => path.join(DEMO_DIR, '.state', `${tenantId}.json`);

export function readState(tenantId) {
  const f = file(tenantId);
  if (!existsSync(f)) {
    return {
      products: {}, prices: {}, priceBooks: {}, metadata: {},
    };
  }
  return JSON.parse(readFileSync(f, 'utf8'));
}

export function writeState(tenantId, state) {
  mkdirSync(path.dirname(file(tenantId)), { recursive: true });
  writeFileSync(file(tenantId), `${JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2)}\n`);
}

// items: [{ key, hash, value }] → { changed: [...values], unchanged: n, removedKeys: [...] }
export function diff(previous = {}, items = [], { force = false } = {}) {
  const next = new Set(items.map((i) => i.key));
  return {
    changed: items.filter((i) => force || previous[i.key] !== i.hash).map((i) => i.value),
    unchanged: items.filter((i) => !force && previous[i.key] === i.hash).length,
    removedKeys: Object.keys(previous).filter((k) => !next.has(k)),
  };
}
