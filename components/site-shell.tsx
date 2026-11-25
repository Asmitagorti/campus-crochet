"use client";
import { useAuth } from "./auth-provider";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MotionConfig } from "motion/react";
import {
  Heart,
  ShoppingBag,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  ArrowRight,
  Minus,
  Plus,
  Check,
  Mail,
  Instagram,
  UserRound,
} from "lucide-react";
import { products, getProduct, photo, money, maxQuantity } from "@/lib/catalog";
import { defaultSettings, SiteSettings } from "@/lib/site-settings";
import type { SiteMode } from "@/lib/site-mode";
import { saleCountdown } from "@/lib/sale-countdown";
import { cartColorsFor, defaultCartColor } from "@/lib/cart-colors";
import { instagramHandle, instagramUrl } from "@/lib/social";
import { Yarn } from "./design";
import ProductPrice from "./product-price";
type ShopState = {
  cart: Record<string, number>;
  cartColors: Record<string, string[]>;
  liked: string[];
  add: (id: string, quantity?: number, color?: string) => void;
  setQuantity: (id: string, n: number) => void;
  clearCart: () => void;
  refreshPreferences: () => Promise<void>;
  toggleLike: (id: string) => void;
  notify: (s: string) => void;
  openBag: () => void;
  ready: boolean;
  settings: SiteSettings;
  catalog: typeof products;
  mode: SiteMode;
};
const ShopContext = createContext<ShopState | null>(null);
export function useShop() {
  const value = useContext(ShopContext);
  if (!value) throw Error("Shop context missing");
  return value;
}
const links = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["About", "/about"],
  ["Journey", "/journey"],
  ["Contact", "/contact"],
];
export default function SiteShell({
  children,
  initialProducts,
  initialSettings,
  initialMode,
  initialSaleEndsAt,
  initialNow,
}: {
  children: React.ReactNode;
  initialProducts: typeof products;
  initialSettings: SiteSettings;
  initialMode: SiteMode;
  initialSaleEndsAt: string | null;
  initialNow: number;
}) {
  const { user, ready: authReady, logout, token } = useAuth();
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [preferencesOwner, setPreferencesOwner] = useState<string | null>(null);
  const [settings, setSettings] = useState(initialSettings);
  const [mode, setMode] = useState<SiteMode>(initialMode);
  const [saleEndsAt, setSaleEndsAt] = useState(initialSaleEndsAt);
  const [clockNow, setClockNow] = useState(initialNow);
  const [catalog, setCatalog] = useState(initialProducts);
  const pathname = usePathname(),
    router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({}),
    [cartColors, setCartColors] = useState<Record<string, string[]>>({}),
    [liked, setLiked] = useState<string[]>([]),
    [ready, setReady] = useState(false),
    [dark, setDark] = useState(false),
    [menu, setMenu] = useState(false),
    [bag, setBag] = useState(false),
    [notice, setNotice] = useState("");
  const drawer = useRef<HTMLElement>(null);
  const refreshedSaleEnd = useRef<string | null>(null);
  const activeUserUid = useRef<string | null>(null);
  activeUserUid.current = user?.uid || null;
  const owned = !!user && preferencesOwner === user.uid;
  const visibleCart = owned ? cart : {};
  const visibleCartColors = owned ? cartColors : {};
  const visibleLiked = owned ? liked : [];
  async function refreshPreferences() {
    if (!user) return;
    const uid = user.uid;
    const response = await fetch("/api/account/preferences", {
      headers: { Authorization: `Bearer ${await token()}` }, cache: "no-store",
    });
    if (!response.ok) throw Error("Your saved bag could not be refreshed.");
    const data = await response.json();
    if (activeUserUid.current !== uid) return;
    setLiked(Array.isArray(data.liked) ? data.liked : []);
    setCart(data.cart && typeof data.cart === "object" ? data.cart : {});
    setCartColors(data.cartColors && typeof data.cartColors === "object" ? data.cartColors : {});
    setPreferencesOwner(uid);
  }
  useEffect(() => {
    setPreferencesReady(false);
    setPreferencesOwner(null);
    setCart({});
    setCartColors({});
    setLiked([]);
    setReady(false);
    setBag(false);
    if (!authReady) return;
    if (!user) { setReady(true); return; }
    let active = true;
    token()
      .then((t) =>
        fetch("/api/account/preferences", {
          headers: { Authorization: `Bearer ${t}` },
        }),
      )
      .then(async (r) => {
        if (!r.ok) throw Error();
        const d = await r.json();
        if (active && activeUserUid.current === user.uid) {
          setLiked(Array.isArray(d.liked) ? d.liked : []);
          setCart(d.cart && typeof d.cart === "object" ? d.cart : {});
          setCartColors(d.cartColors && typeof d.cartColors === "object" ? d.cartColors : {});
          setPreferencesOwner(user.uid);
          setPreferencesReady(true);
          setReady(true);
        }
      })
      .catch(() => { if (active) setNotice("Your saved bag and favourites could not be loaded. Please refresh before shopping."); });
    return () => {
      active = false;
    };
  }, [user?.uid, authReady, token]);
  useEffect(() => {
    if (!user || !preferencesReady || preferencesOwner !== user.uid) return;
    const uid = user.uid;
    const timer = setTimeout(() => {
      if (activeUserUid.current !== uid) return;
      token()
        .then((t) => {
          if (activeUserUid.current !== uid) return;
          return fetch("/api/account/preferences", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${t}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ liked, cart, cartColors }),
          });
        })
        .catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [liked, cart, cartColors, user?.uid, preferencesReady, preferencesOwner, token]);
  useEffect(() => {
    if (!user || !ready || !owned) return;
    const pending = sessionStorage.getItem("campus-pending-bag");
    if (!pending) return;
    sessionStorage.removeItem("campus-pending-bag");
    try {
      const choice = JSON.parse(pending) as { id?: unknown; quantity?: unknown; color?: unknown };
      if (typeof choice.id !== "string" || !Number.isInteger(choice.quantity) ||
        Number(choice.quantity) < 1 || Number(choice.quantity) > 10) return;
      add(choice.id, Number(choice.quantity), typeof choice.color === "string" ? choice.color : undefined);
      setBag(true);
    } catch { /* A stale browser choice should not block sign-in. */ }
  }, [user?.uid, ready, owned]);
  useEffect(() => {
    try {
      localStorage.removeItem("campus-bag");
      localStorage.removeItem("campus-hearts");
      setDark(localStorage.getItem("campus-theme") === "dark");
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("campus-theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    setClockNow(Date.now());
    const timer = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!saleEndsAt || saleCountdown(saleEndsAt, clockNow) ||
      refreshedSaleEnd.current === saleEndsAt) return;
    refreshedSaleEnd.current = saleEndsAt;
    fetch("/api/inventory", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data?.products) setCatalog(data.products); })
      .catch(() => {});
  }, [saleEndsAt, clockNow]);
  useEffect(() => {
    const changed = (event: Event) => {
      const next = (event as CustomEvent).detail;
      if (next === "shop" || next === "poll") setMode(next);
    };
    window.addEventListener("campus-mode-changed", changed);
    return () => window.removeEventListener("campus-mode-changed", changed);
  }, []);
  useEffect(() => {
    if (mode === "poll" && (pathname === "/shop" || pathname === "/checkout" || pathname.startsWith("/products/")))
      router.replace("/vote");
  }, [mode, pathname, router]);
  useEffect(() => {
    setMenu(false);
    setBag(false);
    let active = true;
    const sync = () => {
      fetch("/api/inventory")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!active) return;
          if (data?.products) setCatalog(data.products);
        })
        .catch(() => {});
      fetch("/api/site")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (active && data && !data.error) setSettings(data);
        })
        .catch(() => {});
      fetch("/api/mode", { cache: "no-store" })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (!active || (data?.mode !== "shop" && data?.mode !== "poll")) return;
          setMode(data.mode);
          setSaleEndsAt(typeof data.saleEndsAt === "string" ? data.saleEndsAt : null);
        })
        .catch(() => {});
    };
    sync();
    const timer = setInterval(sync, 30000);
    window.addEventListener("focus", sync);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", sync);
    };
  }, [pathname]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setBag(false);
        setMenu(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  useEffect(() => {
    if (!bag) return;
    const previous = document.activeElement as HTMLElement | null;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawer.current?.querySelector<HTMLElement>("button")?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = drawer.current?.querySelectorAll<HTMLElement>(
        "button:not(:disabled),a[href]",
      );
      if (!nodes?.length) return;
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [bag]);
  function setQuantity(id: string, n: number) {
    if (!user) { router.push("/account"); return; }
    if (!ready || !owned) { setNotice("Your saved bag is still loading. Please try again shortly."); return; }
    const p = catalog.find((p) => p.id === id);
    if (!p) return;
    const max = maxQuantity(p);
    setCart((c) => {
      const next = { ...c };
      if (n <= 0) delete next[id];
      else next[id] = Math.min(max, Math.floor(n));
      return next;
    });
    setCartColors((current) => {
      const next = { ...current };
      if (n <= 0) delete next[id];
      else {
        const existing = cartColorsFor(p, Math.min(max, visibleCart[id] || 0), current[id]);
        next[id] = Array.from({ length: Math.min(max, Math.floor(n)) }, (_, index) =>
          existing[index] || existing.at(-1) || defaultCartColor(p));
      }
      return next;
    });
  }
  function add(id: string, n = 1, color?: string) {
    if (!user) {
      sessionStorage.setItem("campus-pending-bag", JSON.stringify({ id, quantity: n, color }));
      router.push("/account");
      return;
    }
    if (!ready || !owned) { setNotice("Your saved bag is still loading. Please try again shortly."); return; }
    const p = catalog.find((p) => p.id === id);
    if (!p) return;
    const max = maxQuantity(p);
    const selectedColor = p.colorOptions?.find((option) => option.name === color)?.name || defaultCartColor(p);
    const previousCount = visibleCart[id] || 0;
    const nextCount = Math.min(max, previousCount + n);
    setCart((c) => ({ ...c, [id]: nextCount }));
    setCartColors((current) => ({ ...current,
      [id]: [...cartColorsFor(p, previousCount, current[id]),
        ...Array.from({ length: nextCount - previousCount }, () => selectedColor)] }));
    setNotice("A little happiness added to your bag ♡");
  }
  const count = catalog.reduce((sum, p) => sum + (visibleCart[p.id] || 0), 0),
    total = catalog.reduce((sum, p) => sum + (visibleCart[p.id] || 0) * p.price, 0);
  const remaining = saleCountdown(saleEndsAt, clockNow);
  const showSale = !!saleEndsAt && catalog.some((product) => product.regularPrice != null) &&
    remaining !== null;
  const announcementText = showSale
    ? "Opening month offer ✦ Special prices on selected pieces ✦ Free shipping ✦ Handwritten gift card available ✦ Made to order ✦"
    : "Free shipping ✦ Handwritten gift card available ✦ Made to order ✦ Dispatch in 5–7 working days ✦";
  return (
    <ShopContext.Provider
      value={{
        cart: visibleCart,
        cartColors: visibleCartColors,
        liked: visibleLiked,
        add,
        setQuantity,
        clearCart: () => { setCart({}); setCartColors({}); },
        refreshPreferences,
        toggleLike: (id) => {
          if (!user) { router.push("/account"); return; }
          if (!ready || !owned) { setNotice("Your favourites are still loading. Please try again shortly."); return; }
          setLiked((v) => v.includes(id) ? v.filter((x) => x !== id) : [...v, id]);
        },
        notify: setNotice,
        openBag: () => setBag(true),
        ready: ready && (!user || owned),
        catalog,
        settings,
        mode,
      }}
    >
      <MotionConfig reducedMotion="user">
        <div className="site-shell">
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          {mode === "shop" ? <div className="announcement announcement-running">
            <div className="announcement-message">
              <div className="announcement-track">
                <span>{announcementText}</span>
                <span aria-hidden="true">{announcementText}</span>
              </div>
            </div>
            {showSale && <div className="announcement-countdown" aria-label="Opening sale time remaining">
              <span>Sale ends in</span>
              <time dateTime={saleEndsAt}>{remaining &&
                `${remaining.days}d ${String(remaining.hours).padStart(2, "0")}h ${String(remaining.minutes).padStart(2, "0")}m ${String(remaining.seconds).padStart(2, "0")}s`}</time>
            </div>}
          </div> : <div className="announcement">A little yarn. A lot of love. <Heart size={11} /> {settings.announcement}</div>}
          <header>
            <Link className="brand" href="/" aria-label="Campus-Crochet home">
              <Yarn />
              <span>{settings.brand}</span>
            </Link>
            <nav className={menu ? "open" : ""} aria-label="Main navigation">
              {links.map(([name, href]) => (
                <Link
                  key={href}
                  href={mode === "poll" && href === "/shop" ? "/vote" : href}
                  aria-current={
                    (
                      href === "/"
                        ? pathname === href
                        : pathname.startsWith(href)
                    )
                      ? "page"
                      : undefined
                  }
                  onClick={() => setMenu(false)}
                >
                  {mode === "poll" && name === "Shop" ? "Vote" : name}
                </Link>
              ))}
              {user && (
                <button
                  className="nav-signout"
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    void logout();
                  }}
                >
                  Sign out
                </button>
              )}
            </nav>
            <div className="header-actions">
              {mode === "shop" && <form className="search" action="/shop">
                <input
                  name="q"
                  aria-label="Search handmade products"
                  placeholder="Search cute things..."
                />
                <button aria-label="Search">
                  <Search size={16} />
                </button>
              </form>}
              <button
                className="icon-button theme"
                aria-label={
                  dark ? "Switch to light theme" : "Switch to dark theme"
                }
                onClick={() => setDark(!dark)}
              >
                {dark ? <Sun /> : <Moon />}
              </button>
              {mode === "shop" && <Link
                className="icon-button"
                href="/shop?saved=1"
                aria-label="Show favourites"
              >
                <Heart />
              </Link>}
              <Link
                className="icon-button account-link"
                href="/account"
                aria-label={user ? "Your account" : "Sign in"}
              >
                <UserRound />
              </Link>
              {mode === "shop" && <button
                className="icon-button bag-button"
                aria-label={`Open bag, ${count} items`}
                onClick={() => setBag(true)}
              >
                <ShoppingBag />
                <span>{count}</span>
              </button>}
              <button
                className="icon-button mobile-menu"
                aria-label="Toggle navigation"
                aria-expanded={menu}
                onClick={() => setMenu(!menu)}
              >
                {menu ? <X /> : <Menu />}
              </button>
            </div>
          </header>
          <div id="main-content" tabIndex={-1}>
            {children}
          </div>
          <section className="contact-band">
            <Yarn />
            <div>
              <h2>Let's make something lovely ♡</h2>
              <p>
                A tiny gift, a favourite colour, a little idea.
                <br />
                Your next happy thing starts here.
              </p>
            </div>
            <Link className="stitch-button" href="/contact">
              Say a little hello <ArrowRight size={15} />
            </Link>
            <span className="handwritten">
              Small stitches,
              <br />
              big dreams!
            </span>
          </section>
          <footer className="site-footer">
            <div className="footer-grid">
              <div className="footer-about">
                <Yarn />
                <h2>About Campus Crochet</h2>
                <p>Handmade crochet pieces shaped with care by a student maker. Little keepsakes, thoughtful gifts and everyday favourites, one stitch at a time.</p>
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label={`Follow Campus Crochet on Instagram ${instagramHandle}`}>
                  <Instagram size={15} /> {instagramHandle}
                </a>
              </div>
              <div>
                <h2>Customer support</h2>
                <p>Questions about an order, payment or this website? We are here to help.</p>
                <a href="mailto:support@campus-crochet.tech"><Mail size={15} /> support@campus-crochet.tech</a>
                <Link href="/contact">Contact the studio</Link>
              </div>
              <nav aria-label="Policies and guides">
                <h2>Useful links</h2>
                <Link href="/privacy">Privacy policy</Link>
                <Link href="/policies#orders">Orders & fulfillment</Link>
                <Link href="/policies#payments">Payment</Link>
                <Link href="/policies#cancellations">Cancellation</Link>
                <Link href="/policies#returns">Returns & exchanges</Link>
                <Link href="/care">Crochet care guide</Link>
              </nav>
            </div>
            <div className="footer-bottom"><span>© {new Date().getFullYear()} Campus Crochet</span><span>Made with care, one stitch at a time.</span></div>
          </footer>
          {notice && (
            <div className="toast" role="status">
              <Check size={17} />
              {notice}
            </div>
          )}
          {mode === "shop" && bag && (
            <>
              <div className="modal-backdrop" onClick={() => setBag(false)} />
              <aside
                ref={drawer}
                className="cart-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Your bag"
              >
                <div className="cart-heading">
                  <h2>Your little bag ♡</h2>
                  <button
                    className="icon-button"
                    aria-label="Close bag"
                    onClick={() => setBag(false)}
                  >
                    <X />
                  </button>
                </div>
                {count === 0 ? (
                  <div className="empty-state">
                    <ShoppingBag />
                    <h3>A little happiness belongs here.</h3>
                    <Link
                      className="stitch-button"
                      href="/shop"
                      onClick={() => setBag(false)}
                    >
                      Explore the collection <ArrowRight size={15} />
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="cart-items">
                      {catalog
                        .filter((p) => visibleCart[p.id] > 0)
                        .map((p) => (
                          <div className="cart-item" key={p.id}>
                            <Link
                              href={`/products/${p.id}`}
                              onClick={() => setBag(false)}
                            >
                              <img src={p.colorOptions?.find((option) => option.name === visibleCartColors[p.id]?.[0])?.image || p.gallery[0]} alt={p.name} />
                            </Link>
                            <div>
                              <Link
                                href={`/products/${p.id}`}
                                onClick={() => setBag(false)}
                              >
                                <h3>{p.name}</h3>
                              </Link>
                              <p><ProductPrice product={p} showSavings={false} /></p>
                              {!!p.colorOptions?.length && <small className="cart-colour-summary">
                                {cartColorsFor(p, visibleCart[p.id], visibleCartColors[p.id]).map((color, index) =>
                                  <span key={index}>{visibleCart[p.id] > 1 ? `Piece ${index + 1}: ` : ""}{color}</span>)}
                              </small>}
                              <div className="quantity">
                                <button
                                  aria-label={`Remove one ${p.name}`}
                                  onClick={() =>
                                    setQuantity(p.id, visibleCart[p.id] - 1)
                                  }
                                >
                                  <Minus size={13} />
                                </button>
                                <span>{visibleCart[p.id]}</span>
                                <button
                                  disabled={
                                    visibleCart[p.id] >=
                                    maxQuantity(p)
                                  }
                                  aria-label={`Add one ${p.name}`}
                                  onClick={() =>
                                    setQuantity(p.id, visibleCart[p.id] + 1)
                                  }
                                >
                                  <Plus size={13} />
                                </button>
                                <button
                                  className="remove-link"
                                  onClick={() => setQuantity(p.id, 0)}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="cart-summary">
                      <div className="total-line">
                        <strong>Subtotal</strong>
                        <strong>{money(total)}</strong>
                      </div>
                      <p>Shipping is free for every order. Each piece is made after you order.</p>
                      <Link
                        className="stitch-button full-button"
                        href="/checkout"
                        onClick={() => setBag(false)}
                      >
                        Continue to checkout <ArrowRight size={15} />
                      </Link>
                      <button
                        className="text-link"
                        onClick={() => {
                          setBag(false);
                          router.push("/shop");
                        }}
                      >
                        A little more browsing
                      </button>
                    </div>
                  </>
                )}
              </aside>
            </>
          )}
        </div>
      </MotionConfig>
    </ShopContext.Provider>
  );
}
