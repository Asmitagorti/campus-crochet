/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
(async () => {
  const names = fs.readFileSync('.env', 'utf8').split(/\r?\n/).map(l => l.match(/^([A-Z_0-9]+)=/)?.[1]).filter(Boolean);
  console.log('Configured variables:', names.join(', '));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return console.log('Supabase server credentials unavailable');
  const r = await fetch(`${url}/rest/v1/`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  const spec = await r.json();
  if (!r.ok) return console.log('Schema inspection failed:', r.status, spec.code || '');
  fs.writeFileSync('scripts/database-schema.json', JSON.stringify(spec.definitions || {}, null, 2));
  for (const [name, def] of Object.entries(spec.definitions || {})) console.log(name, JSON.stringify(def.properties));
  console.log('Available RPCs:', Object.keys(spec.paths || {}).filter(p => p.startsWith('/rpc/')).join(', '));
  for (const table of ['orders', 'custom_requests', 'users']) {
    const result = await fetch(`${url}/rest/v1/${table}?select=*&limit=0`, { headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' } });
    console.log(table, result.status, result.headers.get('content-range'));
  }
})().catch(e => { console.error('Inspection failed:', e.message); process.exitCode = 1; });
