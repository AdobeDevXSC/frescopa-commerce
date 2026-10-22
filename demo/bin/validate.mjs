#!/usr/bin/env node
// Validates the demo catalog (DA or local seed) against the ACO product schema and cross-document rules.
import { loadSchema, parseArgs } from '../lib/config.mjs';
import { loadCatalog } from '../lib/catalog.mjs';
import { validateCatalog } from '../lib/validate.mjs';

const HELP = `Usage: npm run validate -- [--source=da|local]
  --source=da     read /products and /commerce/settings from DA (default; needs DA_ORG, DA_SITE, DA_TOKEN)
  --source=local  read demo/seed/ instead`;

export function printReport(result, catalog) {
  console.log(`Catalog: ${catalog.source} — ${catalog.products.length} products, ${catalog.priceBooks.length} price books, ${catalog.metadata.length} attributes`);
  if (catalog.skipped?.length) console.log(`Skipped (not aco-product documents): ${catalog.skipped.join(', ')}`);
  for (const w of result.warnings) console.log(`  warn   ${w.where}: ${w.message}`);
  for (const e of result.errors) console.log(`  ERROR  ${e.where}: ${e.message}`);
  console.log(result.ok ? 'OK: catalog is valid.' : `FAILED: ${result.errors.length} error(s).`);
}

async function main() {
  const args = parseArgs();
  if (args.help) { console.log(HELP); return; }
  const catalog = await loadCatalog({ source: args.source });
  const result = validateCatalog({ schema: loadSchema(), ...catalog });
  printReport(result, catalog);
  if (!result.ok) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.message); process.exitCode = 1; });
}
