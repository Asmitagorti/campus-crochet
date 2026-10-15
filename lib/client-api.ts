'use client';
import { supabase } from './supabase';
let syncing: Promise<void> | null = null;
export async function syncSession() {
  if (syncing) return syncing;
  syncing = (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const r = await fetch('/api/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ access_token: session.access_token }) });
    if (!r.ok) throw new Error('Your session could not be verified. Please sign in again.');
  })().finally(() => { syncing = null; });
  return syncing;
}
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  await syncSession();
  const r = await fetch(url, { cache: 'no-store', ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || `Request failed (${r.status})`);
  return body as T;
}
