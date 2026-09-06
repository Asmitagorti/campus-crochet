"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Page, Navigate, AuthUser, CartItem } from "../types";

import Navbar from "./Navbar";
import Footer from "./Footer";
import LoginModal from "./LoginModal";
import CustomOrderModal from "./CustomOrderModal";

import HomePage from "./screens/HomeScreen";
import CatalogPage from "./screens/CatalogScreen";
import ProductDetailPage from "./screens/ProductDetailScreen";
import CustomerDashboard from "./screens/CustomerDashboardScreen";
import AdminDashboard from "./screens/AdminDashboardScreen";
import AddProductPage from "./screens/AddProductScreen";
import PastCreationsPage from "./screens/PastCreationsScreen";
import PaymentPage from "./screens/PaymentScreen";
import AboutPage from "./screens/AboutScreen";
import CartPage from "./screens/CartScreen";
import AIAssistantPage from "./screens/AIAssistantScreen";

import { supabase } from "../lib/supabase";

const ADMIN_EMAIL = "asmileis4evr@gmail.com";

function isAdminUser(user: AuthUser | null): boolean {
  return !!user && (user.role === "admin" || user.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase());
}

const ADMIN_PAGES: Page[] = [
  "admin",
  "add-product",
  "past-creations",
];

const NO_FOOTER_PAGES: Page[] = [
  "admin",
  "add-product",
  "past-creations",
];

export default function App() {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loginMode, setLoginMode] = useState<
    "toast" | "modal" | null
  >(null);
  const [loginCount, setLoginCount] = useState(0);
  const [loginToast, setLoginToast] = useState("");

  // Controls whether the scroll login prompt can appear again
  const [scrollPromptDismissed, setScrollPromptDismissed] =
    useState(false);

  // ── Routing ──────────────────────────────────────────────────────────────
  const [page, setPage] = useState<Page>("home");
  const [pageData, setPageData] = useState<Record<string, string>>({});

  // ── Cart (localStorage) ──────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("campus_crochet_cart");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load cart from localStorage", e);
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("campus_crochet_cart", JSON.stringify(cart));
      } catch (e) {
        console.error("Failed to save cart to localStorage", e);
      }
    }
  }, [cart]);

  // ── Custom Order ─────────────────────────────────────────────────────────
  const [showCustomOrder, setShowCustomOrder] = useState(false);

  // ── Restore Supabase session ─────────────────────────────────────────────
  useEffect(() => {
    async function syncServerSession(token?: string) {
      if (token) {
        await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: token }),
        }).catch(() => {});
      } else {
        await fetch("/api/session", { method: "DELETE" }).catch(() => {});
      }
    }

    async function restoreSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        console.log(
          "🔐 Existing session found:",
          session.user.email
        );

        if (session.access_token) {
          await syncServerSession(session.access_token);
        }

        const isEmailAdmin = session.user.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
        const role: AuthUser["role"] = isEmailAdmin
          ? "admin"
          : (session.user.user_metadata?.role as AuthUser["role"]) || "customer";

        const metaName = session.user.user_metadata?.name?.trim();
        const fallbackName = session.user.email ? session.user.email.split("@")[0] : "Student";
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email ?? "",
          role,
          name: isEmailAdmin ? (metaName || "Admin") : (metaName || fallbackName || "Student"),
        };

        setUser(authUser);
      }
    }

    restoreSession();

    // Listen for login/logout/session changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT" || !session?.user) {
          if (event === "SIGNED_OUT") {
            await syncServerSession(undefined);
          }
          setUser(null);
          return;
        }

        // Mirror the Supabase access token to an HttpOnly
        // cookie so server-side routes can verify the user
        // without trusting the client body.
        if (session.access_token) {
          await syncServerSession(session.access_token);
        }

        const isEmailAdmin = session.user.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
        const role: AuthUser["role"] = isEmailAdmin
          ? "admin"
          : (session.user.user_metadata?.role as AuthUser["role"]) || "customer";

        const metaName = session.user.user_metadata?.name?.trim();
        const fallbackName = session.user.email ? session.user.email.split("@")[0] : "Student";
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email ?? "",
          role,
          name: isEmailAdmin ? (metaName || "Admin") : (metaName || fallbackName || "Student"),
        };

        setUser(authUser);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ── Scroll-triggered login toast ────────────────────────────────────────
  useEffect(() => {
    if (user || scrollPromptDismissed) return;

    function onScroll() {
      if (window.scrollY > 600 && !user) {
        setLoginMode("toast");
      }
    }

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () =>
      window.removeEventListener("scroll", onScroll);
  }, [user, scrollPromptDismissed]);

  // ── Auto-dismiss login success toast ─────────────────────────────────────
  useEffect(() => {
    if (!loginToast) return;

    const timer = setTimeout(() => {
      setLoginToast("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [loginToast]);

  // ── Handle AI Assistant "Add to Cart" events ────────────────────────────
  useEffect(() => {
    function handleAIAddToCart(event: CustomEvent) {
      const { productId, color, quantity } = event.detail;
      addToCart(productId, color, quantity);
      navigate("cart");
    }

    window.addEventListener("ai-add-to-cart", handleAIAddToCart as EventListener);
    return () => window.removeEventListener("ai-add-to-cart", handleAIAddToCart as EventListener);
    // addToCart/navigate are stable enough; intentionally excluded to dodge
    // a TDZ warning and an unnecessary re-subscribe loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Navigation ───────────────────────────────────────────────────────────
  const navigate: Navigate = useCallback(
    (target, data) => {
      console.log("🚀 NAVIGATE:", target);

      setPage(target);

      if (data) {
        setPageData(data);
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    },
    []
  );

  // ── Login ────────────────────────────────────────────────────────────────
  function handleLogin(authedUser: AuthUser) {
    setUser(authedUser);
    setLoginCount((count) => count + 1);
    setLoginMode(null);
    setScrollPromptDismissed(true);

    setLoginToast(
      `Welcome${
        authedUser.name
          ? ", " + authedUser.name
          : ""
      }! You're signed in. 🧶`
    );

    if (authedUser.role === "admin" || isAdminUser(authedUser)) {
      navigate("admin");
    }
  }

  // ── Logout through Supabase ──────────────────────────────────────────────
  async function handleLogout() {
    await supabase.auth.signOut();

    setUser(null);
    setPage("home");
    setShowCustomOrder(false);

    window.scrollTo({
      top: 0,
    });
  }

  // ── Login modal ──────────────────────────────────────────────────────────
  function openLogin() {
    setLoginMode("modal");
  }

  function dismissLogin() {
    setLoginMode(null);

    if (!user) {
      setScrollPromptDismissed(true);
    }
  }

  // ── Cart (localStorage backed) ───────────────────────────────────────────
  function addToCart(
    productId: string,
    color: string,
    quantity = 1
  ) {
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.productId === productId &&
          item.color === color
      );

      if (existing) {
        return prev.map((item) =>
          item.productId === productId &&
          item.color === color
            ? {
                ...item,
                quantity: Math.min(item.quantity + quantity, 20),
              }
            : item
        );
      }

      return [
        ...prev,
        {
          productId,
          color,
          quantity: Math.min(quantity, 20),
        },
      ];
    });
  }

  function updateCartQty(
    productId: string,
    color: string,
    qty: number
  ) {
    if (qty <= 0) {
      removeFromCart(productId, color);
      return;
    }

    const cappedQty = Math.min(qty, 20);

    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId &&
        item.color === color
          ? {
              ...item,
              quantity: cappedQty,
            }
          : item
      )
    );
  }

  function removeFromCart(
    productId: string,
    color: string
  ) {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.color === color
          )
      )
    );
  }

  function clearCart() {
    setCart([]);
  }

  // ── Layout ───────────────────────────────────────────────────────────────
  const showNavbar = !ADMIN_PAGES.includes(page);
  const showFooter = !NO_FOOTER_PAGES.includes(page);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFFDF8",
        fontFamily:
          "DM Sans, system-ui, sans-serif",
      }}
    >
      {/* Navbar */}
      {showNavbar && (
        <Navbar
          page={page}
          navigate={navigate}
          cart={cart}
          user={user}
          onLoginClick={openLogin}
          onLogout={handleLogout}
        />
      )}

      {/* Home */}
      {page === "home" && (
        <HomePage
          navigate={navigate}
          onCustomOrder={() =>
            setShowCustomOrder(true)
          }
          onAddToCart={addToCart}
        />
      )}

      {/* Catalog */}
      {page === "catalog" && (
        <CatalogPage
          navigate={navigate}
          initialCategory={pageData.category}
          onAddToCart={addToCart}
          onCustomOrder={() =>
            setShowCustomOrder(true)
          }
        />
      )}

      {/* Product */}
      {page === "product" && (
        <ProductDetailPage
          navigate={navigate}
          productId={pageData.id ?? null}
          onAddToCart={addToCart}
        />
      )}

      {/* Customer Dashboard */}
      {page === "dashboard" && (
        <CustomerDashboard
          navigate={navigate}
          user={user}
          onLoginClick={openLogin}
        />
      )}

      {/* Admin */}
      {page === "admin" &&
        isAdminUser(user) && (
          <AdminDashboard
            navigate={navigate}
            onLogout={handleLogout}
            loginCount={loginCount}
          />
        )}

      {page === "admin" && !isAdminUser(user) && (
        <main
          style={{
            minHeight: "60vh",
            backgroundColor: "#FFFDF8",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "3rem 1.5rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2.5rem" }}>🔒</div>
          <h2
            style={{
              fontFamily: "Playfair Display, Georgia, serif",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#2E1D15",
            }}
          >
            Admin access required
          </h2>
          <p style={{ color: "#7A6058", maxWidth: 340, lineHeight: 1.7 }}>
            This area is only available to the maker's admin account.
          </p>
          <button
            onClick={() => navigate("home")}
            style={{
              backgroundColor: "#C97B63",
              color: "#FFFDF8",
              fontWeight: 600,
              padding: "0.7rem 1.5rem",
              borderRadius: 50,
              border: "none",
              cursor: "pointer",
              fontSize: "0.88rem",
            }}
          >
            Back to home
          </button>
        </main>
      )}

      {/* Add Product */}
      {page === "add-product" && isAdminUser(user) && (
        <AddProductPage
          navigate={navigate}
        />
      )}

      {/* Past Creations */}
      {page === "past-creations" && isAdminUser(user) && (
        <PastCreationsPage
          navigate={navigate}
        />
      )}

      {/* Payment */}
      {page === "payment" && (
        <PaymentPage
          navigate={navigate}
          cart={cart}
          user={user}
          onClearCart={clearCart}
          onRequireLogin={openLogin}
        />
      )}

      {/* About */}
      {page === "about" && (
        <AboutPage navigate={navigate} />
      )}

      {/* Cart */}
      {page === "cart" && (
        <CartPage
          navigate={navigate}
          cart={cart}
          onUpdateQty={updateCartQty}
          onRemove={removeFromCart}
          user={user}
          onRequireLogin={openLogin}
        />
      )}

      {/* AI Assistant */}
      {page === "ai-assistant" && (
        <AIAssistantPage
          navigate={navigate}
          user={user}
          onRequireLogin={openLogin}
        />
      )}

      {/* Footer */}
      {showFooter && (
        <Footer
          navigate={navigate}
          onCustomOrder={() =>
            setShowCustomOrder(true)
          }
        />
      )}

      {/* Login modal / scroll toast */}
      {loginMode && (
        <LoginModal
          mode={loginMode}
          onLogin={handleLogin}
          onDismiss={dismissLogin}
        />
      )}

      {/* Custom Order modal */}
      {showCustomOrder && (
        <CustomOrderModal
          user={user}
          onClose={() =>
            setShowCustomOrder(false)
          }
          onRequireLogin={() => {
            setShowCustomOrder(false);
            openLogin();
          }}
        />
      )}

      {/* Login success toast */}
      {loginToast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
            backgroundColor: "#2E1D15",
            color: "#FFFDF8",
            borderRadius: 50,
            padding: "0.7rem 1.5rem",
            fontSize: "0.88rem",
            fontWeight: 500,
            boxShadow:
              "0 8px 28px rgba(46,29,21,0.3)",
            whiteSpace: "nowrap",
            animation: "slideUp 0.3s ease",
          }}
        >
          {loginToast}
        </div>
      )}

      {/* Toast animation */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform:
              translateX(-50%)
              translateY(12px);
          }

          to {
            opacity: 1;
            transform:
              translateX(-50%)
              translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

