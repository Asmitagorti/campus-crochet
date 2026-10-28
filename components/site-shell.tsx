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
  UserRound,
} from "lucide-react";
import { products, getProduct, photo, money, maxQuantity } from "@/lib/catalog";
import { defaultSettings, SiteSettings } from "@/lib/site-settings";
import { Yarn } from "./design";
type ShopState = {
  cart: Record<string, number>;
  liked: string[];
  add: (id: string, quantity?: number) => void;
  setQuantity: (id: string, n: number) => void;
  clearCart: () => void;
  refreshPreferences: () => Promise<void>;
  toggleLike: (id: string) => void;
  notify: (s: string) => void;
  openBag: () => void;
  ready: boolean;
  settings: SiteSettings;
  catalog: typeof products;
  stocks: Record<string, number>;
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
}: {
  children: React.ReactNode;
  initialProducts: typeof products;
  initialSettings: SiteSettings;
}) {
  const { user, ready: authReady, logout, token } = useAuth();
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [preferencesOwner, setPreferencesOwner] = useState<string | null>(null);
  const [settings, setSettings] = useState(initialSettings);
  const [catalog, setCatalog] = useState(initialProducts);
  const pathname = usePathname(),
    router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({}),
    [liked, setLiked] = useState<string[]>([]),
    [ready, setReady] = useState(false),
    [stocks, setStocks] = useState<Record<string, number>>({}),
    [dark, setDark] = useState(false),
    [menu, setMenu] = useState(false),
    [bag, setBag] = useState(false),
    [notice, setNotice] = useState("");
  const drawer = useRef<HTMLElement>(null);
  const activeUserUid = useRef<string | null>(null);
  activeUserUid.current = user?.uid || null;
  const owned = !!user && preferencesOwner === user.uid;
  const visibleCart = owned ? cart : {};
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
    setPreferencesOwner(uid);
  }
  useEffect(() => {
    setPreferencesReady(false);
    setPreferencesOwner(null);
    setCart({});
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
            body: JSON.stringify({ liked, cart }),
          });
        })
        .catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [liked, cart, user?.uid, preferencesReady, preferencesOwner, token]);
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
    setMenu(false);
    setBag(false);
    let active = true;
    const sync = () => {
      fetch("/api/inventory")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!active) return;
          if (data?.stock) setStocks(data.stock);
          if (data?.products) setCatalog(data.products);
        })
        .catch(() => {});
      fetch("/api/site")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (active && data && !data.error) setSettings(data);
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
    const max = Math.min(maxQuantity(p), stocks[id] ?? p.stock ?? 0);
    setCart((c) => {
      const next = { ...c };
      if (n <= 0) delete next[id];
      else next[id] = Math.min(max, Math.floor(n));
      return next;
    });
  }
  function add(id: string, n = 1) {
    if (!user) { router.push("/account"); return; }
    if (!ready || !owned) { setNotice("Your saved bag is still loading. Please try again shortly."); return; }
    const p = catalog.find((p) => p.id === id);
    if (!p) return;
    const max = Math.min(maxQuantity(p), stocks[id] ?? p.stock ?? 0);
    if (!max) {
      setNotice("This little piece has sold out. Ask us about making another.");
      return;
    }
    setCart((c) => ({ ...c, [id]: Math.min(max, (c[id] || 0) + n) }));
    setNotice("A little happiness added to your bag ♡");
  }
  const count = catalog.reduce((sum, p) => sum + (visibleCart[p.id] || 0), 0),
    total = catalog.reduce((sum, p) => sum + (visibleCart[p.id] || 0) * p.price, 0);
  return (
    <ShopContext.Provider
      value={{
        cart: visibleCart,
        liked: visibleLiked,
        add,
        setQuantity,
        clearCart: () => setCart({}),
        refreshPreferences,
        toggleLike: (id) => {
          if (!user) { router.push("/account"); return; }
          if (!ready || !owned) { setNotice("Your favourites are still loading. Please try again shortly."); return; }
          setLiked((v) => v.includes(id) ? v.filter((x) => x !== id) : [...v, id]);
        },
        notify: setNotice,
        openBag: () => setBag(true),
        ready: ready && (!user || owned),
        stocks,
        catalog,
        settings,
      }}
    >
      <MotionConfig reducedMotion="user">
        <div className="site-shell">
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <div className="announcement">
            A little yarn. A lot of love. <Heart size={11} />{" "}
            {settings.announcement}
          </div>
          <header>
            <Link className="brand" href="/" aria-label="Campus-Crochet home">
              <Yarn />
              <span>{settings.brand}</span>
            </Link>
            <nav className={menu ? "open" : ""} aria-label="Main navigation">
              {links.map(([name, href]) => (
                <Link
                  key={href}
                  href={href}
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
                  {name}
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
              <form className="search" action="/shop">
                <input
                  name="q"
                  aria-label="Search handmade products"
                  placeholder="Search cute things..."
                />
                <button aria-label="Search">
                  <Search size={16} />
                </button>
              </form>
              <button
                className="icon-button theme"
                aria-label={
                  dark ? "Switch to light theme" : "Switch to dark theme"
                }
                onClick={() => setDark(!dark)}
              >
                {dark ? <Sun /> : <Moon />}
              </button>
              <Link
                className="icon-button"
                href="/shop?saved=1"
                aria-label="Show favourites"
              >
                <Heart />
              </Link>
              <Link
                className="icon-button account-link"
                href="/account"
                aria-label={user ? "Your account" : "Sign in"}
              >
                <UserRound />
              </Link>
              <button
                className="icon-button bag-button"
                aria-label={`Open bag, ${count} items`}
                onClick={() => setBag(true)}
              >
                <ShoppingBag />
                <span>{count}</span>
              </button>
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
          {bag && (
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
                              <img src={p.gallery[0]} alt={p.name} />
                            </Link>
                            <div>
                              <Link
                                href={`/products/${p.id}`}
                                onClick={() => setBag(false)}
                              >
                                <h3>{p.name}</h3>
                              </Link>
                              <p>{money(p.price)}</p>
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
                                    Math.min(maxQuantity(p), stocks[p.id] ?? 25)
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
                      <p>Aditya Surampalem delivery included. For supported PIN codes elsewhere, checkout shows delivery before payment.</p>
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
