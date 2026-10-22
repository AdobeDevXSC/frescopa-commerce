// ACO ingestion limits: ≤100 items and ≤200 KB per request, 300 requests/min.
// The SDK already retries 408/413/429/5xx; we chunk and pace requests.
export const MAX_ITEMS = 100;
export const MAX_BYTES = 190 * 1024;
const PACE_MS = 220; // ≈270 requests/min

export function chunk(items, { maxItems = MAX_ITEMS, maxBytes = MAX_BYTES } = {}) {
  const batches = [];
  let current = [];
  let bytes = 2;
  for (const item of items) {
    const size = Buffer.byteLength(JSON.stringify(item)) + 1;
    if (current.length && (current.length >= maxItems || bytes + size > maxBytes)) {
      batches.push(current);
      current = [];
      bytes = 2;
    }
    current.push(item);
    bytes += size;
  }
  if (current.length) batches.push(current);
  return batches;
}

const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });

// Sends items in batches with `send(batch)` (an SDK method). Returns totals; throws on the first hard failure.
export async function sendInBatches(label, items, send, { log = console.log } = {}) {
  let accepted = 0;
  const batches = chunk(items);
  for (const [i, batch] of batches.entries()) {
    const res = await send(batch);
    if (!res?.ok) {
      throw new Error(`${label} batch ${i + 1}/${batches.length} failed: ${res?.status} ${res?.statusText} ${JSON.stringify(res?.data)}`);
    }
    accepted += res.data?.acceptedCount ?? batch.length;
    log(`  ${label}: batch ${i + 1}/${batches.length} (${batch.length}) → ${res.status}`);
    if (i < batches.length - 1) await sleep(PACE_MS);
  }
  return { sent: items.length, accepted, batches: batches.length };
}
