import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSettings } from '../lib/settings.mjs';

const sheet = (data) => ({ ':type': 'multi-sheet', ...data });

test('parseSettings: multi-sheet shape', () => {
  const r = parseSettings(sheet({
    settings: { data: [{ key: 'locale', value: 'fr-FR' }, { key: 'skuPrefix', value: 'X-' }, { key: 'extra', value: ' v ' }] },
    'price-books': { data: [{ priceBookId: 'a', name: 'A', currency: 'EUR' }] },
    metadata: { data: [{ code: 'brand' }] },
    shoppers: { data: [{ email: 'a@b.c', name: 'A', group: 'g' }, { name: 'no email' }] },
  }));
  assert.equal(r.settings.locale, 'fr-FR');
  assert.equal(r.settings.skuPrefix, 'X-');
  assert.equal(r.settings.extra, 'v');
  assert.equal(r.priceBooks[0].currency, 'EUR');
  assert.deepEqual(r.shoppers, [{ email: 'a@b.c', name: 'A', group: 'g' }]);
});

test('parseSettings: single-sheet shape is the settings tab', () => {
  const r = parseSettings({ ':type': 'sheet', data: [{ key: 'locale', value: 'de-DE' }] });
  assert.equal(r.settings.locale, 'de-DE');
  assert.deepEqual(r.priceBooks, []);
  assert.deepEqual(r.metadata, []);
  const bare = parseSettings({ data: [{ key: 'customer', value: 'C' }] });
  assert.equal(bare.settings.customer, 'C');
});

test('parseSettings: defaults for empty sheet', () => {
  const { settings } = parseSettings({});
  assert.equal(settings.locale, 'en-US');
  assert.equal(settings.skuPrefix, '');
  assert.equal(settings.catalogViewId, '');
  assert.equal(settings.defaultPriceBookId, '');
});

test('parseSettings: boolean parsing', () => {
  const rows = ['true', 'x', 'X', 'yes', '1', 'no', 'false', '', 'nope'].map((v, i) => ({
    code: `c${i}`, filterable: v, searchable: v === 'true', sortable: v,
  }));
  const { metadata } = parseSettings(sheet({ metadata: { data: rows } }));
  assert.deepEqual(
    metadata.map((m) => m.filterable),
    [true, true, true, true, true, false, false, false, false],
  );
  assert.equal(metadata[0].searchable, true);
});

test('parseSettings: metadata defaults and visibleIn lists', () => {
  const { metadata } = parseSettings(sheet({
    metadata: { data: [{ code: 'a', visibleIn: 'SEARCH_RESULTS, PRODUCT_DETAIL ,' }, { code: 'b', dataType: 'number' }] },
  }));
  assert.deepEqual(metadata[0].visibleIn, ['SEARCH_RESULTS', 'PRODUCT_DETAIL']);
  assert.deepEqual(metadata[1].visibleIn, ['PRODUCT_DETAIL', 'PRODUCT_LISTING', 'SEARCH_RESULTS']);
  assert.equal(metadata[0].dataType, 'TEXT');
  assert.equal(metadata[1].dataType, 'NUMBER');
  assert.equal(metadata[0].label, 'a');
});

test('parseSettings: defaultPriceBookId falls back to first book, explicit wins', () => {
  const books = { 'price-books': { data: [{ priceBookId: 'one' }, { priceBookId: 'two' }] } };
  assert.equal(parseSettings(sheet(books)).settings.defaultPriceBookId, 'one');
  const explicit = parseSettings(sheet({
    ...books, settings: { data: [{ key: 'defaultPriceBookId', value: 'two' }] },
  }));
  assert.equal(explicit.settings.defaultPriceBookId, 'two');
});

test('parseSettings: price book derivedFrom/adjustPercent', () => {
  const { priceBooks } = parseSettings(sheet({
    'price-books': {
      data: [
        { priceBookId: 'base' },
        {
          priceBookId: 'vip', derivedFrom: 'base', adjustPercent: '-15', shopperGroup: 'vip',
        },
        { priceBookId: 'num', derivedFrom: 'base', adjustPercent: 5 },
        { name: 'skipped, no id' },
      ],
    },
  }));
  assert.equal(priceBooks.length, 3);
  assert.equal(priceBooks[0].derivedFrom, undefined);
  assert.equal(priceBooks[0].adjustPercent, undefined);
  assert.equal(priceBooks[0].currency, 'USD');
  assert.equal(priceBooks[0].name, 'base');
  assert.equal(priceBooks[1].derivedFrom, 'base');
  assert.equal(priceBooks[1].adjustPercent, -15);
  assert.equal(priceBooks[1].shopperGroup, 'vip');
  assert.equal(priceBooks[2].adjustPercent, 5);
});
