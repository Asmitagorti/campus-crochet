"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { browserDatabase } from "@/lib/supabase-client";
import { afterGoogleDestination, isSuccessfulGoogleCallback } from "@/lib/auth-redirect";

type AccountUser = { uid: string; email: string | null; displayName: string | null };
type AuthState = {
  user: AccountUser | null;
  ready: boolean;
  admin: boolean;
  error: string;
  login: (destination?: "/admin" | "/vote") => Promise<void>;
  logout: () => Promise<void>;
  token: () => Promise<string>;
};
const Context = createContext<AuthState | null>(null);
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw Error("Auth context missing");
  return value;
}
const accountUser = (user: SupabaseUser | null): AccountUser | null => user ? {
  uid: user.id,
  email: user.email || null,
  displayName: String(user.user_metadata?.full_name || user.user_metadata?.name || "") || null,
} : null;

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const callbackSucceeded = useRef(false);
  const sync = useCallback(async (current: SupabaseUser | null, accessToken?: string) => {
    const run = ++generation.current;
    setUser(accountUser(current));
    setAdmin(false);
    setError("");
    if (current && accessToken) {
      try {
        const response = await fetch("/api/auth/session", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
        const data = await response.json();
        if (run === generation.current) {
          if (response.ok) {
            setAdmin(data.admin === true);
            if (callbackSucceeded.current) {
              callbackSucceeded.current = false;
              const destination = sessionStorage.getItem("campus-after-google");
              sessionStorage.removeItem("campus-after-google");
              const target = afterGoogleDestination(destination, data.admin === true);
              if (target && window.location.pathname !== target) window.location.replace(target);
            }
          }
          else {
            callbackSucceeded.current = false;
            sessionStorage.removeItem("campus-after-google");
            setUser(null);
            setError(data.error || "Your account could not be loaded.");
          }
        }
      } catch {
        if (run === generation.current) {
          callbackSucceeded.current = false;
          sessionStorage.removeItem("campus-after-google");
          setError("Your account could not be loaded. Please try again.");
        }
      }
    }
    if (run === generation.current) setReady(true);
  }, []);
  useEffect(() => {
    const callbackHasCode = new URLSearchParams(window.location.search).has("code");
    if (!callbackHasCode) sessionStorage.removeItem("campus-after-google");
    const db = browserDatabase();
    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => void sync(session?.user || null, session?.access_token), 0);
    });
    void db.auth.getSession().then(({ data, error: sessionError }) => {
      if (callbackHasCode) {
        callbackSucceeded.current = isSuccessfulGoogleCallback(callbackHasCode,
          new URLSearchParams(window.location.search).has("code"), !!data.session, !!sessionError);
        if (!callbackSucceeded.current) sessionStorage.removeItem("campus-after-google");
      }
      return sync(data.session?.user || null, data.session?.access_token);
    });
    return () => { subscription.unsubscribe(); generation.current++; };
  }, [sync]);
  async function login(destination?: "/admin" | "/vote") {
    setError("");
    sessionStorage.setItem("campus-after-google", destination || "/account");
    const { error: authError } = await browserDatabase().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/account`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (authError) {
      sessionStorage.removeItem("campus-after-google");
      setError(authError.message);
    }
  }
  const token = useCallback(async () => {
    const { data, error: authError } = await browserDatabase().auth.getSession();
    if (authError || !data.session?.access_token) throw Error("Please sign in to continue.");
    return data.session.access_token;
  }, []);
  async function logout() {
    const { error: authError } = await browserDatabase().auth.signOut();
    if (authError) { setError(authError.message); return; }
    sessionStorage.removeItem("campus-payment");
    localStorage.removeItem("campus-bag");
    localStorage.removeItem("campus-hearts");
    setUser(null);
    setAdmin(false);
  }
  return <Context.Provider value={{ user, ready, admin, error, login, logout, token }}>{children}</Context.Provider>;
}
