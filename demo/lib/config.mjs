import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';

export const DEMO_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

dotenv.config({ path: path.join(DEMO_DIR, '.env'), quiet: true });

export function env(name, { required = true, fallback } = {}) {
  const value = process.env[name] ?? fallback;
  if (required && (value === undefined || value === '')) {
    throw new Error(`Missing ${name}. Copy demo/.env.example to demo/.env and fill it in.`);
  }
  return value;
}

export function acoConfig() {
  return {
    clientId: env('ACO_CLIENT_ID'),
    clientSecret: env('ACO_CLIENT_SECRET'),
    tenantId: env('ACO_TENANT_ID'),
    region: env('ACO_REGION', { fallback: 'na1' }),
    environment: env('ACO_ENVIRONMENT', { fallback: 'sandbox' }),
  };
}

export function daConfig({ needToken = true } = {}) {
  return {
    org: env('DA_ORG'),
    site: env('DA_SITE'),
    token: needToken ? env('DA_TOKEN') : process.env.DA_TOKEN,
  };
}

export function loadSchema() {
  return JSON.parse(readFileSync(path.join(DEMO_DIR, 'schema/aco-product.schema.json'), 'utf8'));
}

export function graphqlEndpoint({ tenantId, region, environment }) {
  const host = `${region.toLowerCase()}${environment.toLowerCase() === 'production' ? '' : '-sandbox'}.api.commerce.adobe.com`;
  return `https://${host}/${tenantId}/graphql`;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { _: [] };
  for (const a of argv) {
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      args[k] = v === undefined ? true : v;
    } else args._.push(a);
  }
  return args;
}

export const SEED_DIR = path.join(DEMO_DIR, 'seed');
export const hasSeed = () => existsSync(path.join(SEED_DIR, 'settings.json'));
