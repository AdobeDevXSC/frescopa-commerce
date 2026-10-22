// Generates demo/seed/products/*.json from the live Fréscopa site's public Catalog Service.
import {
  writeFileSync, readdirSync, unlinkSync, mkdirSync,
} from 'node:fs';
import path from 'node:path';
import { validateData } from '@adobe/da-sc-sdk';
import { loadSchema, SEED_DIR } from '../lib/config.mjs';
import { SCHEMA_NAME } from '../lib/catalog.mjs';

const ENDPOINT = 'https://catalog-service-sandbox.adobe.io/graphql';
const HEADERS = {
  'Content-Type': 'application/json',
  'x-api-key': 'catalog-service-sandbox-apollo',
  'Magento-Environment-Id': 'e731ca28-168d-4ba3-8cb4-e647f0418e7a',
  'Magento-Store-Code': 'main_website_store',
  'Magento-Store-View-Code': 'default',
  'Magento-Website-Code': 'base',
  'Magento-Customer-Group': 'b6589fc6ab0dc82cf12099d1c2d40ab994e8410c',
};
const QUERY = `{
  productSearch(phrase: "", page_size: 100) {
    items {
      productView {
        sku name urlKey shortDescription description
        images(roles: []) { url label roles }
        ... on SimpleProductView { price { regular { amount { value currency } } } }
      }
    }
  }
}`;

const CATEGORIES = {
  CSM: 'Coffee Machines', HB: 'Bagged Coffee', POD: 'Coffee Pods', TEA: 'Tea', ACC: 'Accessories', ITT: 'Accessories',
};
const FEATURED = new Set(['HBDR212', 'POD311', 'CSM5125', 'ACC558']);
const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', eacute: 'é',
};

const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return String.fromCodePoint(code);
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

function toText(html, max) {
  let t = decode(String(html || '')
    .replace(/<\s*(br|\/p|\/li|\/div|\/h\d)\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ''))
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (t.length > max) {
    const cut = t.slice(0, max);
    const sp = cut.lastIndexOf(' ');
    t = (sp > max * 0.5 ? cut.slice(0, sp) : cut).trim();
  }
  return t;
}

async function fetchProducts() {
  const res = await fetch(ENDPOINT, { method: 'POST', headers: HEADERS, body: JSON.stringify({ query: QUERY }) });
  if (!res.ok) throw new Error(`Catalog Service ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) console.warn(`Note: ${json.errors.length} partial GraphQL error(s) ignored.`);
  const items = json.data?.productSearch?.items;
  if (!items?.length) throw new Error('Catalog Service returned no products');
  return items.map((i) => i.productView).filter(Boolean);
}

function toDoc(p) {
  const prefix = Object.keys(CATEGORIES).find((k) => p.sku.toUpperCase().startsWith(k));
  const category = CATEGORIES[prefix];
  if (!category) throw new Error(`No category mapping for SKU ${p.sku}`);
  const data = {
    sku: p.sku,
    name: p.name,
    slug: slugify(p.name),
    status: 'ENABLED',
    category,
    brand: 'Fréscopa',
  };
  const short = toText(p.shortDescription, 400);
  const long = toText(p.description, 4000);
  if (short) data.shortDescription = short;
  if (long) data.description = long;
  if (FEATURED.has(p.sku)) data.featured = true;
  const img = p.images?.find((i) => i.url);
  if (img) data.images = [{ url: img.url.replace(/^http:/, 'https:'), label: p.name, role: 'BASE' }];
  const value = p.price?.regular?.amount?.value;
  if (value === undefined || value === null) throw new Error(`No price for ${p.sku}`);
  data.prices = [{ priceBookId: 'retail', regular: value }];
  return { metadata: { schemaName: SCHEMA_NAME }, data };
}

async function main() {
  const schema = loadSchema();
  const docs = (await fetchProducts()).map(toDoc);

  const slugs = new Set();
  const failures = [];
  for (const { data } of docs) {
    if (slugs.has(data.slug)) failures.push(`${data.sku}: duplicate slug ${data.slug}`);
    slugs.add(data.slug);
    const result = validateData({ schema, data });
    Object.entries(result.errors || {}).forEach(([ptr, e]) => failures.push(`${data.sku}${ptr}: ${e.message}`));
  }
  if (failures.length) throw new Error(`Validation failed:\n  ${failures.join('\n  ')}`);

  const dir = path.join(SEED_DIR, 'products');
  mkdirSync(dir, { recursive: true });
  const keep = new Set(docs.map((d) => `${d.data.slug}.json`));
  readdirSync(dir).filter((f) => f.endsWith('.json') && !keep.has(f)).forEach((f) => {
    unlinkSync(path.join(dir, f));
    console.log(`removed stale ${f}`);
  });
  docs.forEach((d) => writeFileSync(path.join(dir, `${d.data.slug}.json`), `${JSON.stringify(d, null, 2)}\n`));

  console.table(docs.map(({ data: d }) => ({
    sku: d.sku,
    slug: d.slug,
    category: d.category,
    price: d.prices[0].regular,
    featured: !!d.featured,
  })));
  console.log(`Wrote ${docs.length} products to ${dir}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
