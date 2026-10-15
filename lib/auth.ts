import 'server-only';
import { cookies } from 'next/headers';
import type { AuthUser } from '@/types';
export const ADMIN_EMAIL = 'asmileis4evr@gmail.com';
export type SessionUser = AuthUser;
export function isAdminEmail(email: string) {
  return (process.env.ADMIN_EMAILS || ADMIN_EMAIL).split(',').map(v => v.trim().toLowerCase()).includes(email.trim().toLowerCase());
}
export function isAdmin(user: SessionUser | null) { return !!user && isAdminEmail(user.email); }
export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get('cc-session')?.value;
  if (!token) return null;
  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, { headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const u = await r.json();
    if (!u.id || !u.email || !u.email_confirmed_at) return null;
    const m = u.user_metadata || {};
    return { id: u.id, email: u.email, role: isAdminEmail(u.email) ? 'admin' : 'customer', name: m.name || u.email.split('@')[0],
      college: m.college, department: m.department, year: m.year, phone: m.phone, rollnumber: m.rollnumber };
  } catch { return null; }
}
export async function requireSession() {
  const user = await getSession();
  if (!user) throw Response.json({ error: 'Please sign in to continue.' }, { status: 401 });
  return user;
}
export async function requireAdmin() {
  const user = await requireSession();
  if (!isAdmin(user)) throw Response.json({ error: 'Administrator access is required.' }, { status: 403 });
  return user;
}
