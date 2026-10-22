// Parses the /commerce/settings sheet. Accepts the DA/EDS sheet JSON shapes:
//   multi-sheet: { ":type": "multi-sheet", ":names": [...], "<tab>": { data: [...] } }
//   single sheet: { ":type": "sheet", data: [...] }  (treated as the "settings" tab)
const truthy = (v) => v === true || ['true', 'yes', 'y', '1', 'x'].includes(String(v ?? '').trim().toLowerCase());
const list = (v) => String(v ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const num = (v) => (v === undefined || v === null || v === '' ? undefined : Number(v));

function tab(sheet, name) {
  if (sheet?.[':type'] === 'sheet' || Array.isArray(sheet?.data)) return name === 'settings' ? sheet.data : [];
  return sheet?.[name]?.data ?? [];
}

export function parseSettings(sheet) {
  const kv = Object.fromEntries(tab(sheet, 'settings')
    .filter((r) => r.key)
    .map((r) => [String(r.key).trim(), String(r.value ?? '').trim()]));

  const priceBooks = tab(sheet, 'price-books').filter((r) => r.priceBookId).map((r) => ({
    priceBookId: String(r.priceBookId).trim(),
    name: String(r.name || r.priceBookId).trim(),
    currency: String(r.currency || 'USD').trim(),
    shopperGroup: String(r.shopperGroup || '').trim() || undefined,
    derivedFrom: String(r.derivedFrom || '').trim() || undefined,
    adjustPercent: num(r.adjustPercent),
  }));

  const metadata = tab(sheet, 'metadata').filter((r) => r.code).map((r) => ({
    code: String(r.code).trim(),
    label: String(r.label || r.code).trim(),
    dataType: String(r.dataType || 'TEXT').trim().toUpperCase(),
    filterable: truthy(r.filterable),
    searchable: truthy(r.searchable),
    sortable: truthy(r.sortable),
    visibleIn: list(r.visibleIn || 'PRODUCT_DETAIL,PRODUCT_LISTING,SEARCH_RESULTS'),
  }));

  const shoppers = tab(sheet, 'shoppers').filter((r) => r.email).map((r) => ({
    email: String(r.email).trim(), name: String(r.name || '').trim(), group: String(r.group || '').trim(),
  }));

  const settings = {
    locale: kv.locale || 'en-US',
    skuPrefix: kv.skuPrefix ?? '',
    catalogViewId: kv.catalogViewId || '',
    defaultPriceBookId: kv.defaultPriceBookId || priceBooks[0]?.priceBookId || '',
    customer: kv.customer || '',
    label: kv.label || '',
    demoId: kv.demoId || '',
    ...kv,
  };
  return {
    settings, priceBooks, metadata, shoppers,
  };
}
