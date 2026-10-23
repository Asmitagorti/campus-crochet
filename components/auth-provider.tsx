"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase-client";
type AuthState = {
  user: User | null;
  ready: boolean;
  admin: boolean;
  error: string;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  token: () => Promise<string>;
};
const Context = createContext<AuthState | null>(null);
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw Error("Auth context missing");
  return value;
}
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null),
    [ready, setReady] = useState(false),
    [admin, setAdmin] = useState(false),
    [error, setError] = useState("");
  useEffect(
    () =>
      onAuthStateChanged(firebaseAuth(), async (current) => {
        setUser(current);
        setAdmin(false);
        if (current) {
          try {
            const response = await fetch("/api/auth/session", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${await current.getIdToken()}`,
              },
            });
            const data = await response.json();
            if (response.ok) {
              const fresh = await current.getIdTokenResult(true);
              setAdmin(fresh.claims.role === "admin" && data.admin === true);
            } else setError(data.error || "Your account could not be loaded.");
          } catch {
            setError("Your account could not be loaded. Please try again.");
          }
        }
        setReady(true);
      }),
    [],
  );
  async function login() {
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(firebaseAuth(), provider);
    } catch (e) {
      const code = (e as { code?: string }).code;
      const message =
        code === "auth/popup-closed-by-user"
          ? "Sign-in was closed. You can try again whenever you are ready."
          : code === "auth/unauthorized-domain"
            ? "This website address needs to be added to Firebase authorised domains."
            : code === "auth/operation-not-allowed"
              ? "Google sign-in needs to be enabled for this Firebase project."
              : "Google sign-in could not finish. Please try again.";
      setError(message);
    }
  }
  const token = useCallback(async () => {
    const current = firebaseAuth().currentUser;
    if (!current) throw Error("Please sign in with Google.");
    return current.getIdToken();
  }, []);
  return (
    <Context.Provider
      value={{
        user,
        ready,
        admin,
        error,
        login,
        logout: async () => {
          await signOut(firebaseAuth());
          setAdmin(false);
        },
        token,
      }}
    >
      {children}
    </Context.Provider>
  );
}
