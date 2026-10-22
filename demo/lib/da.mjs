// Minimal Document Authoring (admin.da.live) client: list, read and write source documents and sheets.
const ADMIN = 'https://admin.da.live';

async function call(url, { token, method = 'GET', body } = {}) {
  const res = await fetch(url, { method, body, headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (res.status === 401 || res.status === 403) throw new Error(`DA ${method} ${url}: ${res.status}. DA_TOKEN missing, expired or without access.`);
  return res;
}

export async function listFolder({ org, site, token }, folder) {
  const res = await call(`${ADMIN}/list/${org}/${site}/${folder.replace(/^\/|\/$/g, '')}`, { token });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`DA list ${folder}: ${res.status}`);
  return res.json();
}

export async function getSource({ org, site, token }, filePath) {
  const res = await call(`${ADMIN}/source/${org}/${site}/${filePath.replace(/^\//, '')}`, { token });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`DA get ${filePath}: ${res.status}`);
  return res.text();
}

export async function putSource({ org, site, token }, filePath, content, type = 'text/html') {
  const form = new FormData();
  form.append('data', new Blob([content], { type }));
  const res = await call(`${ADMIN}/source/${org}/${site}/${filePath.replace(/^\//, '')}`, { token, method: 'POST', body: form });
  if (!res.ok) throw new Error(`DA put ${filePath}: ${res.status} ${await res.text()}`);
  return res;
}
