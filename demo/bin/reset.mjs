#!/usr/bin/env node
// Removes this demo's data from the ACO tenant: prices and products for every demo SKU (catalog ∪ last sync),
// and with --all also the demo's price books and attribute metadata. Requires --yes.
import { createClient, consoleLogger, LogLevel } from '@adobe-commerce/aco-ts-sdk';
import { acoConfig, parseArgs } from '../lib/config.mjs';
import { loadCatalog } from '../lib/catalog.mjs';
import { readState, writeState } from '../lib/state.mjs';
import { sendInBatches } from '../lib/batch.mjs';
import { buildFeeds } from './sync.mjs';

const HELP = `Usage: npm run reset -- --yes [--all] [--source=da|local] [--dry-run]
  --yes      required: confirms deleting this demo's SKUs from the tenant
  --all      also delete the demo's price books and attribute metadata`;

async function main() {
  const args = parseArgs();
  if (args.help || (!args.yes && !args['dry-run'])) { console.log(HELP); if (!args.help) process.exitCode = 1; return; }
  const cfg = acoConfig();
  const catalog = await loadCatalog({ source: args.source });
  const { locale, skuPrefix } = catalog.settings;
  if (!skuPrefix) throw new Error('settings › skuPrefix is empty; refusing to reset without a demo SKU prefix.');
  const state = readState(cfg.tenantId);
  const feeds = buildFeeds(catalog);
  const union = (a, b) => [...new Set([...a, ...b])];
  const skus = union(feeds.products.map((p) => p.key), Object.keys(state.products || {})).filter((s) => s.startsWith(skuPrefix));
  const prices = union(feeds.prices.map((p) => p.key), Object.keys(state.prices || {})).filter((k) => k.startsWith(skuPrefix));
  const books = args.all ? union(feeds.priceBooks.map((b) => b.key), Object.keys(state.priceBooks || {})) : [];
  const meta = args.all ? union(feeds.metadata.map((m) => m.key), Object.keys(state.metadata || {})) : [];
  console.log(`Tenant ${cfg.tenantId}: delete ${prices.length} prices, ${skus.length} products${args.all ? `, ${books.length} price books, ${meta.length} attributes` : ''}.`);
  if (args['dry-run']) return;

  const client = createClient({
    credentials: { clientId: cfg.clientId, clientSecret: cfg.clientSecret },
    tenantId: cfg.tenantId,
    region: cfg.region,
    environment: cfg.environment,
    timeoutMs: 30000,
    logger: consoleLogger(LogLevel.ERROR),
  });
  if (prices.length) await sendInBatches('prices (delete)', prices.map((k) => { const [sku, priceBookId] = k.split('|'); return { sku, priceBookId }; }), (b) => client.deletePrices(b));
  if (skus.length) await sendInBatches('products (delete)', skus.map((sku) => ({ sku, source: { locale } })), (b) => client.deleteProducts(b));
  if (books.length) await sendInBatches('price books (delete)', books.map((priceBookId) => ({ priceBookId })), (b) => client.deletePriceBooks(b));
  if (meta.length) await sendInBatches('metadata (delete)', meta.map((code) => ({ code, source: { locale } })), (b) => client.deleteProductMetadata(b));
  writeState(cfg.tenantId, {
    products: {}, prices: {}, priceBooks: args.all ? {} : state.priceBooks, metadata: args.all ? {} : state.metadata,
  });
  console.log('Done.');
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; });
