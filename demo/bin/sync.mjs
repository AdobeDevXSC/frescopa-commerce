#!/usr/bin/env node
// Syncs the demo catalog to an Adobe Commerce Optimizer tenant:
// product metadata → price books → products → prices, only what changed since the last run.
import { createClient, consoleLogger, LogLevel } from '@adobe-commerce/aco-ts-sdk';
import { acoConfig, loadSchema, parseArgs } from '../lib/config.mjs';
import { loadCatalog } from '../lib/catalog.mjs';
import { validateCatalog } from '../lib/validate.mjs';
import {
  toFeedProduct, toFeedPrices, toFeedPriceBooks, toFeedMetadata, hashOf,
} from '../lib/mapping.mjs';
import { readState, writeState, diff } from '../lib/state.mjs';
import { sendInBatches } from '../lib/batch.mjs';
import { printReport } from './validate.mjs';

const HELP = `Usage: npm run sync -- [--source=da|local] [--dry-run] [--prune] [--force]
  --dry-run  show what would change; no calls to ACO (credentials optional)
  --prune    delete demo SKUs, prices, price books and attributes that are no longer in the catalog
  --force    resend everything, ignoring demo/.state/<tenant>.json`;

export function buildFeeds(catalog) {
  const ctx = { settings: catalog.settings, priceBooks: catalog.priceBooks };
  const products = catalog.products.map(({ data }) => toFeedProduct(data, ctx));
  const prices = catalog.products.flatMap(({ data }) => toFeedPrices(data, ctx));
  return {
    metadata: toFeedMetadata(catalog.metadata, ctx).map((m) => ({ key: m.code, hash: hashOf(m), value: m })),
    priceBooks: toFeedPriceBooks(catalog.priceBooks).map((b) => ({ key: b.priceBookId, hash: hashOf(b), value: b })),
    products: products.map((p) => ({ key: p.sku, hash: hashOf(p), value: p })),
    prices: prices.map((p) => ({ key: `${p.sku}|${p.priceBookId}`, hash: hashOf(p), value: p })),
  };
}

const hashes = (items) => Object.fromEntries(items.map((i) => [i.key, i.hash]));

async function main() {
  const args = parseArgs();
  if (args.help) { console.log(HELP); return; }
  const dryRun = Boolean(args['dry-run']);

  const catalog = await loadCatalog({ source: args.source });
  const check = validateCatalog({ schema: loadSchema(), ...catalog });
  printReport(check, catalog);
  if (!check.ok) { process.exitCode = 1; return; }

  const { locale } = catalog.settings;
  const tenantId = process.env.ACO_TENANT_ID || (dryRun ? 'dry-run' : acoConfig().tenantId);
  const state = readState(tenantId);
  const feeds = buildFeeds(catalog);
  const opts = { force: Boolean(args.force) };
  const plan = Object.fromEntries(Object.entries(feeds).map(([k, items]) => [k, diff(state[k], items, opts)]));

  console.log(`\nTenant ${tenantId}${dryRun ? ' (dry run)' : ''}:`);
  for (const [k, d] of Object.entries(plan)) {
    console.log(`  ${k.padEnd(10)} ${d.changed.length} to send, ${d.unchanged} unchanged${args.prune ? `, ${d.removedKeys.length} to delete` : ''}`);
  }
  if (dryRun) {
    plan.products.changed.forEach((p) => console.log(`    ~ ${p.sku}  ${p.name}`));
    if (args.prune) plan.products.removedKeys.forEach((sku) => console.log(`    - ${sku}`));
    return;
  }

  const cfg = acoConfig();
  const client = createClient({
    credentials: { clientId: cfg.clientId, clientSecret: cfg.clientSecret },
    tenantId: cfg.tenantId,
    region: cfg.region,
    environment: cfg.environment,
    timeoutMs: 30000,
    logger: consoleLogger(args.debug ? LogLevel.DEBUG : LogLevel.ERROR),
  });
  const save = (k) => {
    state[k] = hashes(feeds[k]);
    writeState(tenantId, state);
  };

  // Metadata first: ACO needs attribute metadata before products reference the attributes.
  if (plan.metadata.changed.length) await sendInBatches('metadata', plan.metadata.changed, (b) => client.createProductMetadata(b));
  save('metadata');
  if (plan.priceBooks.changed.length) await sendInBatches('price books', plan.priceBooks.changed, (b) => client.createPriceBooks(b));
  save('priceBooks');

  // New SKUs are created; SKUs seen in a previous run are updated.
  const known = new Set(Object.keys(state.products || {}));
  const fresh = plan.products.changed.filter((p) => !known.has(p.sku));
  const existing = plan.products.changed.filter((p) => known.has(p.sku));
  if (fresh.length) await sendInBatches('products (create)', fresh, (b) => client.createProducts(b));
  if (existing.length) await sendInBatches('products (update)', existing, (b) => client.updateProducts(b));
  save('products');
  if (plan.prices.changed.length) await sendInBatches('prices', plan.prices.changed, (b) => client.createPrices(b));
  save('prices');

  if (args.prune) {
    const gonePrices = plan.prices.removedKeys.map((k) => { const [sku, priceBookId] = k.split('|'); return { sku, priceBookId }; });
    if (gonePrices.length) await sendInBatches('prices (delete)', gonePrices, (b) => client.deletePrices(b));
    const goneSkus = plan.products.removedKeys.map((sku) => ({ sku, source: { locale } }));
    if (goneSkus.length) await sendInBatches('products (delete)', goneSkus, (b) => client.deleteProducts(b));
    const goneBooks = plan.priceBooks.removedKeys.map((priceBookId) => ({ priceBookId }));
    if (goneBooks.length) await sendInBatches('price books (delete)', goneBooks, (b) => client.deletePriceBooks(b));
    const goneMeta = plan.metadata.removedKeys.map((code) => ({ code, source: { locale } }));
    if (goneMeta.length) await sendInBatches('metadata (delete)', goneMeta, (b) => client.deleteProductMetadata(b));
  }
  console.log('\nDone. Ingestion is asynchronous: allow a few minutes, then run "npm run verify".');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.message); process.exitCode = 1; });
}
