"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Heart, X, ArrowRight } from "lucide-react";
import { categories } from "@/lib/catalog";
import { ProductCard } from "./product-card";
import { useShop } from "./site-shell";
import { Sprig } from "./design";
export default function Shop() {
  const params = useSearchParams(),
    router = useRouter(),
    { liked, stocks, catalog: products } = useShop();
  const q = params.get("q") || "",
    category = params.get("category") || "All",
    saved = params.get("saved") === "1";
  const [sort, setSort] = useState("featured"),
    [inStock, setInStock] = useState(false);
  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "All") next.set(key, value);
    else next.delete(key);
    router.replace(`/shop${next.size ? `?${next}` : ""}`, { scroll: false });
  }
  let list = products.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      (!saved || liked.includes(p.id)) &&
      (!inStock || (stocks[p.id] ?? p.stock ?? 0) > 0) &&
      `${p.name} ${p.category} ${p.note}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
  if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
  if (sort === "name")
    list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <main className="shop-page">
      <section className="page-heading">
        <Sprig className="heading-sprig" />
        <span className="eyebrow">The little things are the big things</span>
        <h1>
          {saved ? "Your little favourites" : "Find your little happy thing"}{" "}
          <span>♡</span>
        </h1>
        <p>Soft stitches. Thoughtful gifts. A little handmade happiness.</p>
        <span className="heading-doodle">
          made slowly,
          <br />
          loved for real
        </span>
      </section>
      <div className="page-wrap shop-layout">
        <aside className="shop-sidebar">
          <h2>
            The collection <Heart size={19} />
          </h2>
          <div className="category-filters">
            {["All", ...categories.map((c) => c.name)].map((c) => (
              <button
                key={c}
                className={category === c ? "chosen" : ""}
                onClick={() => update("category", c)}
              >
                {c === "All" ? "All the little things" : c}
                <span>
                  {
                    products.filter((p) => c === "All" || p.category === c)
                      .length
                  }
                </span>
              </button>
            ))}
          </div>
          <div className="sidebar-note">
            <Sprig />
            <h3>Every piece has a person behind it.</h3>
            <p>
              One maker. Ten years of love for the craft. Thank you for choosing
              handmade.
            </p>
            <Link href="/about">
              Meet the story <ArrowRight size={13} />
            </Link>
          </div>
        </aside>
        <section className="shop-results" aria-label="Products">
          <div className="shop-controls">
            <label className="shop-search">
              <Search size={17} />
              <input
                value={q}
                onChange={(e) => update("q", e.target.value)}
                placeholder="Find something lovely…"
                aria-label="Search the collection"
              />
              {q && (
                <button
                  onClick={() => update("q", "")}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </label>
            <label className="sort-select">
              <SlidersHorizontal size={15} />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort products"
              >
                <option value="featured">Our favourites</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
                <option value="name">Name: A–Z</option>
              </select>
            </label>
          </div>
          <div className="results-info">
            <span>
              {list.length} little{" "}
              {list.length === 1 ? "treasure" : "treasures"}{" "}
              {saved ? "saved for you" : "to discover"}
            </span>
            <label>
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
              />{" "}
              In stock only
            </label>
            {saved && (
              <button onClick={() => update("saved", "")}>
                Show everything <X size={12} />
              </button>
            )}
          </div>
          <div className="product-grid shop-grid">
            {list.map((p, i) => (
              <ProductCard
                key={p.id}
                product={{ ...p, stock: stocks[p.id] ?? p.stock }}
                index={i}
              />
            ))}
          </div>
          {!list.length && (
            <div className="empty-state">
              <Heart size={32} />
              <h3>
                {saved
                  ? "Your favourites are waiting to be found."
                  : "No little treasures found this time."}
              </h3>
              <p>
                {saved
                  ? "Tap a heart on something you love to save it here."
                  : "Try a different word or explore the whole collection."}
              </p>
              <Link className="stitch-button" href="/shop">
                Explore everything <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </section>
      </div>
      <section className="shop-bottom-note page-wrap">
        <span>♡</span>
        <div>
          <h2>A little idea of your own?</h2>
          <p>
            Tell us what you are dreaming of. We will let you know what is
            possible.
          </p>
        </div>
        <Link className="stitch-button" href="/contact?topic=custom">
          Let's talk <ArrowRight size={15} />
        </Link>
      </section>
    </main>
  );
}
