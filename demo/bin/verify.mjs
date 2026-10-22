#!/usr/bin/env node
// Checks the storefront (Merchandising GraphQL) view of the tenant: every demo SKU is searchable and
// priced as expected in each price book.
import { acoConfig, graphqlEndpoint, parseArgs } from '../lib/config.mjs';
import { loadCatalog } from '../lib/catalog.mjs';
import { buildFeeds } from './sync.mjs';

const HELP = `Usage: npm run verify -- [--source=da|local] [--view=<catalogViewId>]
Needs ACO_TENANT_ID, ACO_REGION, ACO_ENVIRONMENT and a catalog view id (settings › catalogViewId or --view).`;

const QUERY = `query($page: Int!) { productSearch(phrase: "", page_size: 100, current_page: $page) {
  total_count page_info { total_pages }
  items { productView { sku name ... on SimpleProductView { price { final { amount { value currency } } } } } } } }`;

async function search(endpoint, headers) {
  const found = new Map();
  for (let page = 1; page < 100; page += 1) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ query: QUERY, variables: { page } }),
    });
    const body = await res.json();
    if (!res.ok || !body.data) throw new Error(`GraphQL ${res.status}: ${JSON.stringify(body.errors || body).slice(0, 400)}`);
    const { items, page_info: info } = body.data.productSearch;
    items.forEach(({ productView: v }) => found.set(v.sku, v.price?.final?.amount?.value));
    if (page >= (info?.total_pages || 1)) break;
  }
  return found;
}

async function main() {
  const args = parseArgs();
  if (args.help) { console.log(HELP); return; }
  const cfg = acoConfig();
  const catalog = await loadCatalog({ source: args.source });
  const viewId = args.view || catalog.settings.catalogViewId;
  if (!viewId) throw new Error('No catalog view id. Create one in ACO, then set settings › catalogViewId (or pass --view=).');
  const endpoint = graphqlEndpoint(cfg);
  const feeds = buildFeeds(catalog);
  const expected = feeds.products.filter((p) => p.value.status === 'ENABLED' && p.value.visibleIn.includes('SEARCH')).map((p) => p.key);

  let problems = 0;
  for (const book of catalog.priceBooks) {
    const found = await search(endpoint, {
      'AC-View-ID': viewId, 'AC-Price-Book-ID': book.priceBookId, 'AC-Source-Locale': catalog.settings.locale,
    });
    const want = new Map(feeds.prices.filter((p) => p.value.priceBookId === book.priceBookId).map((p) => [p.value.sku, p.value.regular]));
    const missing = expected.filter((sku) => !found.has(sku));
    const wrong = [...want].filter(([sku, price]) => found.has(sku) && found.get(sku) !== price);
    problems += missing.length + wrong.length;
    console.log(`${book.priceBookId.padEnd(12)} found ${expected.length - missing.length}/${expected.length}${wrong.length ? `, ${wrong.length} price mismatch` : ''}`);
    missing.forEach((sku) => console.log(`    missing ${sku}`));
    wrong.forEach(([sku, price]) => console.log(`    ${sku} expected ${price}, got ${found.get(sku)}`));
  }
  console.log(problems ? `FAILED: ${problems} problem(s). Ingestion can lag a few minutes; re-run before investigating.` : 'OK: storefront view matches the catalog.');
  if (problems) process.exitCode = 1;
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; });
