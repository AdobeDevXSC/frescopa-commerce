// Validates the whole catalog: each product against the schema (da-sc-sdk), plus cross-document rules
// the form editor cannot check (duplicate SKUs/slugs, unknown price books or attribute codes, settings).
import { validateData, validateSchema } from '@adobe/da-sc-sdk';

const RESERVED_ATTRS = new Set(['brand', 'category']);

export function validateCatalog({
  schema, products, settings, priceBooks, metadata,
}) {
  const errors = [];
  const warnings = [];
  const add = (list, where, message) => list.push({ where, message });

  const { valid: schemaOk, schemaIssues } = validateSchema({ schema });
  if (!schemaOk) schemaIssues.forEach((i) => add(errors, 'schema', `${i.schemaPath}: ${i.message}`));

  if (!settings.locale) add(errors, 'settings', 'locale is required');
  if (!priceBooks.length) add(errors, 'settings › price-books', 'at least one price book is required');
  if (settings.defaultPriceBookId && !priceBooks.some((b) => b.priceBookId === settings.defaultPriceBookId)) {
    add(errors, 'settings', `defaultPriceBookId "${settings.defaultPriceBookId}" is not in price-books`);
  }
  if (!settings.catalogViewId) add(warnings, 'settings', 'catalogViewId is empty: create a catalog view in ACO, then set it (needed by verify and the storefront)');
  const bookIds = new Set(priceBooks.map((b) => b.priceBookId));
  for (const b of priceBooks) {
    if (b.derivedFrom && !bookIds.has(b.derivedFrom)) add(errors, `price-books › ${b.priceBookId}`, `derivedFrom "${b.derivedFrom}" does not exist`);
  }
  const metaCodes = new Set(metadata.map((m) => m.code));
  for (const code of RESERVED_ATTRS) {
    if (!metaCodes.has(code)) add(warnings, 'settings › metadata', `"${code}" has no metadata row; it will not be filterable or searchable`);
  }

  const seenSku = new Map();
  const seenSlug = new Map();
  for (const { path, data } of products) {
    const result = validateData({ schema, data });
    for (const [pointer, e] of Object.entries(result.errors || {})) add(errors, `${path}${pointer.replace(/^\/data/, '')}`, e.message);
    if (data.sku) {
      if (seenSku.has(data.sku)) add(errors, path, `duplicate sku "${data.sku}" (also in ${seenSku.get(data.sku)})`);
      seenSku.set(data.sku, path);
    }
    if (data.slug) {
      if (seenSlug.has(data.slug)) add(errors, path, `duplicate slug "${data.slug}" (also in ${seenSlug.get(data.slug)})`);
      seenSlug.set(data.slug, path);
    }
    for (const p of data.prices || []) {
      if (!bookIds.has(p.priceBookId)) add(errors, path, `price book "${p.priceBookId}" is not in settings › price-books`);
    }
    if (!(data.prices || []).length) add(errors, path, 'at least one price is required');
    for (const a of data.attributes || []) {
      if (a?.code && !metaCodes.has(a.code)) add(errors, path, `attribute "${a.code}" has no row in settings › metadata`);
    }
  }
  return { ok: errors.length === 0, errors, warnings };
}
