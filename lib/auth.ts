import { cookies } from "next/headers";
import { createClient, type SupabaseClient as Client } from "@supabase/supabase-js";

export const ADMIN_EMAIL = "asmileis4evr@gmail.com";

const SESSION_COOKIE_NAME = "cc-session";

export interface SessionUser {
  id: string;
  email: string;
  role: "admin" | "student" | "customer";
  name: string;
}

function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
}

function getSupabaseServiceKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

type SupabaseUserResponse = {
  id: string;
  email?: string;
  user_metadata?: {
    role?: string;
    name?: string;
  };
};

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) return null;

  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const user = (await res.json()) as SupabaseUserResponse;

    const role: SessionUser["role"] =
      user.user_metadata?.role === "admin" || user.user_metadata?.role === "student"
        ? user.user_metadata.role
        : "customer";

    const name =
      user.user_metadata?.name?.trim() ||
      user.email?.split("@")[0] ||
      "Student";

    return {
      id: user.id,
      email: user.email ?? "",
      role,
      name,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60, // 1 hour — matches Supabase access-token JWT expiry
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getUserClient(): Promise<Client | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getServiceClient(): Client | null {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();
  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isAdmin(user: SessionUser | null): boolean {
  return !!user && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export async function requireCaller(_req?: Request): Promise<{
  caller: SessionUser & { isAdmin: boolean };
  db: Client;
}> {
  const caller = await requireSession();
  const db = getServiceClient();
  if (!db) {
    throw new Response(JSON.stringify({ error: "Database configuration is missing." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  return {
    caller: { ...caller, isAdmin: isAdmin(caller) },
    db,
  };
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}

export async function requireAdmin(_req?: Request): Promise<{
  caller: SessionUser & { isAdmin: boolean };
  db: Client;
}> {
  const user = await requireSession();
  if (!isAdmin(user)) {
    throw new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const db = getServiceClient();
  if (!db) {
    throw new Response(JSON.stringify({ error: "Database configuration is missing." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  return { caller: { ...user, isAdmin: true }, db };
}