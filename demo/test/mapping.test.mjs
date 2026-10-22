import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  toFeedProduct, toFeedPrices, toFeedPriceBooks, toFeedMetadata, hashOf, round2, prefixed,
} from '../lib/mapping.mjs';

const settings = { locale: 'en-US', skuPrefix: 'P-' };
const base = {
  sku: 'A1', name: 'Alpha', slug: 'alpha', status: 'ENABLED',
};

const hasUndefined = (o) => JSON.stringify(o, (k, v) => (v === undefined ? '__UNDEF__' : v)).includes('__UNDEF__');

test('helpers: round2 and prefixed', () => {
  assert.equal(round2(12.7415), 12.74);
  assert.equal(prefixed('P-', 'A'), 'P-A');
  assert.equal(prefixed(undefined, 'A'), 'A');
});

test('toFeedProduct: core fields, prefix, locale, defaults', () => {
  const p = toFeedProduct({ sku: 'A1', name: 'Alpha', slug: 'alpha' }, { settings });
  assert.equal(p.sku, 'P-A1');
  assert.deepEqual(p.source, { locale: 'en-US' });
  assert.equal(p.status, 'ENABLED');
  assert.deepEqual(p.visibleIn, ['CATALOG', 'SEARCH']);
  assert.deepEqual(p.metaTags, { title: 'Alpha' });
  assert.equal('attributes' in p, false);
  assert.equal('images' in p, false);
});

test('toFeedProduct: keeps explicit status', () => {
  assert.equal(toFeedProduct({ ...base, status: 'DISABLED' }, { settings }).status, 'DISABLED');
});

test('toFeedProduct: visibleIn mapping', () => {
  const v = (visibleIn) => toFeedProduct({ ...base, visibleIn }, { settings }).visibleIn;
  assert.deepEqual(v('CATALOG_AND_SEARCH'), ['CATALOG', 'SEARCH']);
  assert.deepEqual(v('CATALOG'), ['CATALOG']);
  assert.deepEqual(v('SEARCH'), ['SEARCH']);
  assert.deepEqual(v('HIDDEN'), []);
  assert.deepEqual(v(undefined), ['CATALOG', 'SEARCH']);
});

test('toFeedProduct: attributes from brand, category and extras', () => {
  const p = toFeedProduct({
    ...base,
    brand: 'B',
    category: 'Tea',
    attributes: [{ code: 'roast', value: 'dark' }, { code: 'n', value: 5 }, { code: 'empty', value: '' }, { value: 'nocode' }],
  }, { settings });
  assert.deepEqual(p.attributes, [
    { code: 'brand', values: ['B'] },
    { code: 'category', values: ['Tea'] },
    { code: 'roast', values: ['dark'] },
    { code: 'n', values: ['5'] },
  ]);
});

test('toFeedProduct: images and roles', () => {
  const p = toFeedProduct({
    ...base,
    images: [
      { url: 'https://x/1.jpg', label: 'one' },
      { url: 'https://x/2.jpg' },
      { url: 'https://x/3.jpg', role: 'SWATCH' },
      { url: 'https://x/4.jpg', role: 'BASE' },
      { label: 'no url' },
    ],
  }, { settings });
  assert.deepEqual(p.images, [
    { url: 'https://x/1.jpg', label: 'one', roles: ['BASE', 'SMALL', 'THUMBNAIL'] },
    { url: 'https://x/2.jpg' },
    { url: 'https://x/3.jpg', roles: ['SWATCH'] },
    { url: 'https://x/4.jpg', roles: ['BASE', 'SMALL', 'THUMBNAIL'] },
  ]);
});

test('toFeedProduct: metaTags title/description', () => {
  const short = toFeedProduct({ ...base, shortDescription: 'short', description: 'long' }, { settings });
  assert.deepEqual(short.metaTags, { title: 'Alpha', description: 'short' });
  assert.equal(short.description, 'long');
  assert.equal(short.shortDescription, 'short');
  const long = toFeedProduct({ ...base, description: 'x'.repeat(300) }, { settings });
  assert.equal(long.metaTags.description.length, 160);
  assert.equal('shortDescription' in long, false);
});

test('toFeedProduct: no undefined values emitted', () => {
  const minimal = toFeedProduct({ sku: 'A', name: 'N', slug: 's' }, { settings });
  assert.equal(hasUndefined(minimal), false);
  const full = toFeedProduct({
    ...base, brand: 'b', images: [{ url: 'https://x/1.jpg' }], description: 'd',
  }, { settings });
  assert.equal(hasUndefined(full), false);
  for (const v of Object.values(full)) assert.notEqual(v, undefined);
});

const books = [
  { priceBookId: 'base' },
  { priceBookId: 'vip', derivedFrom: 'base', adjustPercent: -15 },
  { priceBookId: 'eu' },
];

test('toFeedPrices: explicit and derived with round2', () => {
  const out = toFeedPrices({ sku: 'A1', prices: [{ priceBookId: 'base', regular: 14.99 }] }, { settings, priceBooks: books });
  assert.deepEqual(out, [
    { sku: 'P-A1', priceBookId: 'base', regular: 14.99 },
    { sku: 'P-A1', priceBookId: 'vip', regular: 12.74 },
  ]);
});

test('toFeedPrices: explicit overrides derived; string numbers coerced', () => {
  const out = toFeedPrices({
    sku: 'A1', prices: [{ priceBookId: 'base', regular: '10' }, { priceBookId: 'vip', regular: 7 }],
  }, { settings, priceBooks: books });
  assert.deepEqual(out.map((p) => [p.priceBookId, p.regular]), [['base', 10], ['vip', 7]]);
});

test('toFeedPrices: derived without adjustPercent equals parent; no prices yields nothing', () => {
  const b = [{ priceBookId: 'base' }, { priceBookId: 'copy', derivedFrom: 'base' }];
  assert.equal(toFeedPrices({ sku: 'A', prices: [{ priceBookId: 'base', regular: 3 }] }, { settings, priceBooks: b })[1].regular, 3);
  assert.deepEqual(toFeedPrices({ sku: 'A' }, { settings, priceBooks: books }), []);
  assert.deepEqual(toFeedPrices({ sku: 'A', prices: [{ priceBookId: 'eu', regular: 'abc' }] }, { settings, priceBooks: books }), []);
});

test('toFeedPriceBooks: only id, name, currency', () => {
  assert.deepEqual(
    toFeedPriceBooks([{
      priceBookId: 'a', name: 'A', currency: 'USD', derivedFrom: 'x', adjustPercent: 1, shopperGroup: 'g',
    }]),
    [{ priceBookId: 'a', name: 'A', currency: 'USD' }],
  );
});

test('toFeedMetadata: shape', () => {
  const out = toFeedMetadata([{
    code: 'brand', label: 'Brand', dataType: 'TEXT', visibleIn: ['SEARCH_RESULTS'], filterable: true, searchable: false, sortable: false,
  }], { settings });
  assert.deepEqual(out, [{
    code: 'brand',
    source: { locale: 'en-US' },
    label: 'Brand',
    dataType: 'TEXT',
    visibleIn: ['SEARCH_RESULTS'],
    filterable: true,
    searchable: false,
    sortable: false,
  }]);
});

test('hashOf: stable sha1 and sensitive to change', () => {
  assert.equal(hashOf({ a: 1 }), hashOf({ a: 1 }));
  assert.notEqual(hashOf({ a: 1 }), hashOf({ a: 2 }));
  assert.match(hashOf('x'), /^[0-9a-f]{40}$/);
});
