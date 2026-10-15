import 'server-only';
import { getServiceRoleClient } from './server-db';
import type { SessionUser } from './auth';
export class ApiError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function failure(error: unknown) {
  if (error instanceof Response) return error;
  const message = error instanceof Error ? error.message : String((error as { message?: string })?.message || 'Request failed');
  const code = (error as { code?: string })?.code;
  if (code === '42P01' || code === 'PGRST202' || code === 'PGRST205' || /schema cache|does not exist/.test(message))
    return Response.json({ error: 'The database upgrade is required. Please contact support.', code: 'MIGRATION_REQUIRED' }, { status: 503 });
  const status = error instanceof ApiError ? error.status : message.includes('CONFLICT:') || code === '23505' ? 409 : code === 'P0001' ? 400 : 500;
  console.error('API failure:', code || '', message);
  return Response.json({ error: status === 500 ? 'Unable to save or load this information. Please try again or contact support.' : message }, { status });
}
export async function readBody(request: Request) {
  const value = await request.json().catch(() => null);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError('Invalid request');
  return value as Record<string, unknown>;
}
export function text(value: unknown, max = 1000) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function ensureProfile(user: SessionUser) {
  const { error } = await getServiceRoleClient().from('users').upsert({ user_id: user.id, email: user.email, full_name: user.name,
    phone_number: user.phone || null, branch: user.department || null, year: /^\d$/.test(user.year || '') ? Number(user.year) : null }, { onConflict: 'user_id' });
  if (error) throw error;
}
export function customerSnapshot(user: SessionUser) {
  return { name: user.name, email: user.email, phone: user.phone || '', college: user.college || '', department: user.department || '', year: user.year || '', rollnumber: user.rollnumber || '' };
}
export async function allRows<T>(queryPage: (start: number, end: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let start = 0; ; start += 500) {
    const { data, error } = await queryPage(start, start + 499);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 500) return rows;
  }
}
