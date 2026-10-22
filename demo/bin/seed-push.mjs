// Pushes the local seed (demo/seed) to DA: products as structured-content HTML,
// settings as a JSON sheet.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { convertJsonToHtml } from '@adobe/da-sc-sdk';
import { daConfig, parseArgs, SEED_DIR } from '../lib/config.mjs';
import { getSource, putSource } from '../lib/da.mjs';
import { PRODUCTS_FOLDER, SETTINGS_PATH } from '../lib/catalog.mjs';

async function main() {
  const args = parseArgs();
  const dryRun = !!args['dry-run'];
  const overwrite = !!args.overwrite;
  const only = typeof args.only === 'string' ? args.only.split(',').map((s) => s.trim()).filter(Boolean) : null;

  const productDir = path.join(SEED_DIR, 'products');
  let slugs = readdirSync(productDir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')).sort();
  if (only) {
    const unknown = only.filter((s) => !slugs.includes(s));
    if (unknown.length) throw new Error(`Unknown slug(s) in --only: ${unknown.join(', ')}`);
    slugs = slugs.filter((s) => only.includes(s));
  }

  const items = slugs.map((slug) => ({
    label: slug,
    target: `${PRODUCTS_FOLDER}/${slug}.html`,
    type: 'text/html',
    content: convertJsonToHtml({
      json: JSON.parse(readFileSync(path.join(productDir, `${slug}.json`), 'utf8')),
    }).html,
  }));
  if (!only) {
    items.push({
      label: 'settings',
      target: SETTINGS_PATH,
      type: 'application/json',
      content: readFileSync(path.join(SEED_DIR, 'settings.json'), 'utf8'),
    });
  }

  const da = daConfig({ needToken: !dryRun });
  console.log(`${dryRun ? '[dry-run] ' : ''}Target: DA ${da.org}/${da.site} (${overwrite ? 'overwrite' : 'skip existing'})`);

  const counts = { written: 0, skipped: 0 };
  for (const item of items) {
    if (dryRun) {
      console.log(`  would write ${item.target} (${item.type}, ${item.content.length} bytes)${overwrite ? '' : ' if absent'}`);
      counts.written += 1;
    } else if (!overwrite && (await getSource(da, item.target)) !== null) {
      console.log(`  skip   ${item.target} (exists)`);
      counts.skipped += 1;
    } else {
      await putSource(da, item.target, item.content, item.type);
      console.log(`  wrote  ${item.target}`);
      counts.written += 1;
    }
  }
  console.log(`${dryRun ? '[dry-run] would write' : 'Written'}: ${counts.written}, skipped: ${counts.skipped}, total: ${items.length}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
