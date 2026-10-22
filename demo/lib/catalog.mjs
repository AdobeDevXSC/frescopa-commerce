// Loads the demo catalog (settings sheet + product documents) from DA or from the local seed.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { convertHtmlToJson } from '@adobe/da-sc-sdk';
import { daConfig, SEED_DIR } from './config.mjs';
import { listFolder, getSource } from './da.mjs';
import { parseSettings } from './settings.mjs';

export const PRODUCTS_FOLDER = 'products';
export const SETTINGS_PATH = 'commerce/settings.json';
export const SCHEMA_NAME = 'aco-product';

export function loadLocalCatalog(dir = SEED_DIR) {
  const sheet = JSON.parse(readFileSync(path.join(dir, 'settings.json'), 'utf8'));
  const productDir = path.join(dir, 'products');
  const products = readdirSync(productDir).filter((f) => f.endsWith('.json')).sort().map((f) => {
    const doc = JSON.parse(readFileSync(path.join(productDir, f), 'utf8'));
    return { path: `/${PRODUCTS_FOLDER}/${f.replace(/\.json$/, '')}`, data: doc.data || {} };
  });
  return { ...parseSettings(sheet), products, source: `local seed (${dir})` };
}

export async function loadDaCatalog() {
  const da = daConfig();
  const sheetText = await getSource(da, SETTINGS_PATH);
  if (!sheetText) throw new Error(`DA ${da.org}/${da.site}/${SETTINGS_PATH} not found. Run "npm run seed:push" or create the sheet.`);
  const entries = (await listFolder(da, PRODUCTS_FOLDER)).filter((e) => e.ext === 'html');
  const products = [];
  const skipped = [];
  for (const e of entries) {
    const rel = e.path.replace(`/${da.org}/${da.site}/`, '');
    const html = await getSource(da, rel);
    const { json, error } = convertHtmlToJson({ html: html || '' });
    if (error || json?.metadata?.schemaName !== SCHEMA_NAME) {
      skipped.push(rel);
    } else {
      products.push({ path: `/${rel.replace(/\.html$/, '')}`, data: json.data || {} });
    }
  }
  return {
    ...parseSettings(JSON.parse(sheetText)), products, skipped, source: `DA ${da.org}/${da.site}`,
  };
}

export const loadCatalog = ({ source = 'da' } = {}) => (source === 'local' ? loadLocalCatalog() : loadDaCatalog());
