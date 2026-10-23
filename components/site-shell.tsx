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
  Phone,
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
  const { user, token } = useAuth();
  const [preferencesReady, setPreferencesReady] = useState(false);
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
  useEffect(() => {
    setPreferencesReady(false);
    if (!user) return;
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
        if (active) {
          setLiked(d.liked);
          setPreferencesReady(true);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user, token]);
  useEffect(() => {
    if (!user || !preferencesReady) return;
    const timer = setTimeout(() => {
      token()
        .then((t) =>
          fetch("/api/account/preferences", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${t}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ liked }),
          }),
        )
        .catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [liked, user, preferencesReady, token]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("campus-bag") || "{}");
      const valid: Record<string, number> = {};
      for (const p of initialProducts) {
        const n = saved[p.id];
        if (Number.isInteger(n) && n > 0)
          valid[p.id] = Math.min(n, maxQuantity(p));
      }
      setCart(valid);
      const hearts = JSON.parse(localStorage.getItem("campus-hearts") || "[]");
      if (Array.isArray(hearts))
        setLiked(
          hearts.filter(
            (id) =>
              typeof id === "string" &&
              initialProducts.some((p) => p.id === id),
          ),
        );
      setDark(localStorage.getItem("campus-theme") === "dark");
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      localStorage.setItem("campus-bag", JSON.stringify(cart));
      localStorage.setItem("campus-hearts", JSON.stringify(liked));
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      localStorage.setItem("campus-theme", dark ? "dark" : "light");
    }
  }, [cart, liked, dark, ready]);
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
  const count = catalog.reduce((sum, p) => sum + (cart[p.id] || 0), 0),
    total = catalog.reduce((sum, p) => sum + (cart[p.id] || 0) * p.price, 0);
  return (
    <ShopContext.Provider
      value={{
        cart,
        liked,
        add,
        setQuantity,
        clearCart: () => setCart({}),
        toggleLike: (id) =>
          setLiked((v) =>
            v.includes(id) ? v.filter((x) => x !== id) : [...v, id],
          ),
        notify: setNotice,
        openBag: () => setBag(true),
        ready,
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
          <footer>
            <div className="footer-top">
              <Link className="brand" href="/">
                <Yarn />
                <span>{settings.brand}</span>
              </Link>
              <nav aria-label="Footer navigation">
                {links.map(([n, h]) => (
                  <Link key={h} href={h}>
                    {n}
                  </Link>
                ))}
              </nav>
              <a className="footer-love" href={`tel:+91${settings.phone}`}>
                <Phone size={13} /> +91 {settings.phone}
              </a>
            </div>
            <div className="footer-bottom">
              <span>
                © {new Date().getFullYear()} Campus-Crochet. All little stitches
                reserved.
              </span>
              <Link href="/privacy">Privacy & care for your details</Link>
              <span>Made with love, one stitch at a time.</span>
            </div>
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
                        .filter((p) => cart[p.id] > 0)
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
                                    setQuantity(p.id, cart[p.id] - 1)
                                  }
                                >
                                  <Minus size={13} />
                                </button>
                                <span>{cart[p.id]}</span>
                                <button
                                  disabled={
                                    cart[p.id] >=
                                    Math.min(maxQuantity(p), stocks[p.id] ?? 25)
                                  }
                                  aria-label={`Add one ${p.name}`}
                                  onClick={() =>
                                    setQuantity(p.id, cart[p.id] + 1)
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
                      <p>Campus pickup · No delivery fee</p>
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
