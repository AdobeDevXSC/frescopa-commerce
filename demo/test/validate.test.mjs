import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCatalog } from '../lib/validate.mjs';
import { loadLocalCatalog } from '../lib/catalog.mjs';
import { loadSchema } from '../lib/config.mjs';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/catalog');
const schema = loadSchema();

const fresh = () => structuredClone(loadLocalCatalog(dir));
const run = (c) => validateCatalog({ schema, ...c });
const has = (r, re) => r.errors.some((e) => re.test(`${e.where} ${e.message}`));
const mutate = (fn) => { const c = fresh(); fn(c); return run(c); };

test('valid fixture catalog passes', () => {
  const r = run(fresh());
  assert.deepEqual(r.errors, []);
  assert.equal(r.ok, true);
  assert.deepEqual(r.warnings, []);
});

for (const field of ['sku', 'name', 'slug', 'status']) {
  test(`schema: missing ${field} is an error`, () => {
    const r = mutate((c) => { delete c.products[0].data[field]; });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => e.where.startsWith('/products/beans')));
  });
}
test('schema: invalid status enum', () => {
  const r = mutate((c) => { c.products[0].data.status = 'MAYBE'; });
  assert.equal(r.ok, false);
  assert.ok(has(r, /beans.*status|status/i));
});

test('schema: bad slug pattern', () => {
  const r = mutate((c) => { c.products[0].data.slug = 'Bad Slug!'; });
  assert.equal(r.ok, false);
  assert.ok(has(r, /slug/));
});

test('duplicate sku', () => {
  const r = mutate((c) => { c.products[1].data.sku = c.products[0].data.sku; });
  assert.ok(has(r, /duplicate sku "BEAN-1"/));
});

test('duplicate slug', () => {
  const r = mutate((c) => { c.products[1].data.slug = c.products[0].data.slug; });
  assert.ok(has(r, /duplicate slug "house-beans"/));
});

test('unknown priceBookId', () => {
  const r = mutate((c) => { c.products[0].data.prices.push({ priceBookId: 'ghost', regular: 1 }); });
  assert.ok(has(r, /price book "ghost" is not in settings/));
});

test('product with no prices', () => {
  const r = mutate((c) => { delete c.products[0].data.prices; });
  assert.ok(has(r, /at least one price is required/));
});

test('attribute code not in metadata', () => {
  const r = mutate((c) => { c.products[0].data.attributes = [{ code: 'mystery', value: 'x' }]; });
  assert.ok(has(r, /attribute "mystery" has no row/));
});

test('defaultPriceBookId not in price books', () => {
  const r = mutate((c) => { c.settings.defaultPriceBookId = 'nope'; });
  assert.ok(has(r, /defaultPriceBookId "nope"/));
});

test('derivedFrom pointing at a missing book', () => {
  const r = mutate((c) => { c.priceBooks[1].derivedFrom = 'missing'; });
  assert.ok(has(r, /derivedFrom "missing" does not exist/));
});

test('no price books and empty locale are errors', () => {
  const r = mutate((c) => { c.priceBooks = []; c.settings.locale = ''; c.settings.defaultPriceBookId = ''; });
  assert.ok(has(r, /at least one price book/));
  assert.ok(has(r, /locale is required/));
});

test('empty catalogViewId is only a warning', () => {
  const r = mutate((c) => { c.settings.catalogViewId = ''; });
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, []);
  assert.ok(r.warnings.some((w) => /catalogViewId/.test(w.message)));
});

test('missing brand/category metadata rows are warnings', () => {
  const r = mutate((c) => { c.metadata = c.metadata.filter((m) => m.code !== 'brand'); });
  assert.equal(r.ok, true);
  assert.ok(r.warnings.some((w) => /"brand" has no metadata row/.test(w.message)));
});
