import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLocalCatalog } from '../lib/catalog.mjs';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/catalog');

test('loadLocalCatalog: reads settings and products from a directory', () => {
  const c = loadLocalCatalog(dir);
  assert.equal(c.settings.locale, 'en-US');
  assert.equal(c.settings.skuPrefix, 'T-');
  assert.equal(c.settings.catalogViewId, 'view-123');
  assert.equal(c.settings.defaultPriceBookId, 'base');
  assert.deepEqual(c.priceBooks.map((b) => b.priceBookId), ['base', 'vip']);
  assert.equal(c.priceBooks[1].adjustPercent, -15);
  assert.deepEqual(c.metadata.map((m) => m.code), ['brand', 'category', 'roast']);
  assert.equal(c.shoppers.length, 1);
  assert.match(c.source, /local seed/);
});

test('loadLocalCatalog: products sorted with /products/<name> paths', () => {
  const c = loadLocalCatalog(dir);
  assert.deepEqual(c.products.map((p) => p.path), ['/products/beans', '/products/espresso', '/products/tea']);
  assert.equal(c.products[1].data.sku, 'ESP-1');
});
