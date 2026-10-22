// Maps DA structured product documents (schema aco-product) to ACO SDK feed objects.
import { createHash } from 'node:crypto';

const VISIBLE = {
  CATALOG_AND_SEARCH: ['CATALOG', 'SEARCH'],
  CATALOG: ['CATALOG'],
  SEARCH: ['SEARCH'],
  HIDDEN: [],
};

export const round2 = (n) => Math.round(n * 100) / 100;
export const prefixed = (prefix, sku) => `${prefix || ''}${sku}`;

export function toFeedProduct(data, { settings }) {
  const attributes = [];
  if (data.brand) attributes.push({ code: 'brand', values: [data.brand] });
  if (data.category) attributes.push({ code: 'category', values: [data.category] });
  for (const a of data.attributes || []) {
    if (a?.code && a.value !== undefined && a.value !== '') attributes.push({ code: a.code, values: [String(a.value)] });
  }
  const images = (data.images || []).filter((i) => i?.url).map((img, i) => {
    const role = img.role || (i === 0 ? 'BASE' : undefined);
    const out = { url: img.url };
    if (img.label) out.label = img.label;
    if (role) out.roles = role === 'BASE' ? ['BASE', 'SMALL', 'THUMBNAIL'] : [role];
    return out;
  });
  const product = {
    sku: prefixed(settings.skuPrefix, data.sku),
    source: { locale: settings.locale },
    name: data.name,
    slug: data.slug,
    status: data.status || 'ENABLED',
    visibleIn: VISIBLE[data.visibleIn || 'CATALOG_AND_SEARCH'] ?? VISIBLE.CATALOG_AND_SEARCH,
  };
  if (data.description) product.description = data.description;
  if (data.shortDescription) product.shortDescription = data.shortDescription;
  const metaDescription = data.shortDescription || (data.description || '').slice(0, 160);
  product.metaTags = { title: data.name, ...(metaDescription ? { description: metaDescription } : {}) };
  if (attributes.length) product.attributes = attributes;
  if (images.length) product.images = images;
  return product;
}

// Explicit prices win; books with derivedFrom + adjustPercent are computed from their parent book.
export function toFeedPrices(data, { settings, priceBooks }) {
  const sku = prefixed(settings.skuPrefix, data.sku);
  const explicit = new Map((data.prices || []).map((p) => [p.priceBookId, Number(p.regular)]));
  const out = [];
  for (const book of priceBooks) {
    let regular = explicit.get(book.priceBookId);
    if (regular === undefined && book.derivedFrom && explicit.has(book.derivedFrom)) {
      regular = round2(explicit.get(book.derivedFrom) * (1 + (book.adjustPercent || 0) / 100));
    }
    if (regular !== undefined && !Number.isNaN(regular)) out.push({ sku, priceBookId: book.priceBookId, regular });
  }
  return out;
}

export function toFeedPriceBooks(priceBooks) {
  return priceBooks.map(({ priceBookId, name, currency }) => ({ priceBookId, name, currency }));
}

export function toFeedMetadata(metadata, { settings }) {
  return metadata.map((m) => ({
    code: m.code,
    source: { locale: settings.locale },
    label: m.label,
    dataType: m.dataType,
    visibleIn: m.visibleIn,
    filterable: m.filterable,
    searchable: m.searchable,
    sortable: m.sortable,
  }));
}

export const hashOf = (value) => createHash('sha1').update(JSON.stringify(value)).digest('hex');
