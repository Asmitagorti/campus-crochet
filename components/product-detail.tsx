"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,
  Check,
  Leaf,
  HandHeart,
  MapPin,
  ZoomIn,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import {
  Product,
  photo,
  money,
  availability,
  maxQuantity,
} from "@/lib/catalog";
import { useShop } from "./site-shell";
import { ProductCard } from "./product-card";
import { Title } from "./design";
export default function ProductDetail({ product: p }: { product: Product }) {
  const { add, liked, toggleLike, stocks, catalog: products } = useShop(),
    router = useRouter();
  const [quantity, setQuantity] = useState(1),
    [image, setImage] = useState(0),
    [tab, setTab] = useState("The little details"),
    [zoom, setZoom] = useState(false);
  const stock = stocks[p.id] ?? p.stock ?? 0,
    max = Math.min(maxQuantity(p), stock),
    available = stock > 0;
  const related = products
    .filter((x) => x.id !== p.id)
    .sort(
      (a, b) =>
        Number(b.category === p.category) - Number(a.category === p.category),
    )
    .slice(0, 4);
  return (
    <main className="product-page page-wrap">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/shop">Shop</Link>
        <span>/</span>
        <Link href={`/shop?category=${encodeURIComponent(p.category)}`}>
          {p.category}
        </Link>
        <span>/</span>
        <span>{p.name}</span>
      </nav>
      <div className="product-detail-layout">
        <motion.div
          className="product-gallery"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="large-product-photo">
            <button
              onClick={() => setZoom(true)}
              aria-label="Enlarge product photo"
            >
              <img
                src={p.gallery[image]}
                alt={`${p.name} — ${image === 0 ? "product view" : "original photograph"}`}
                width={800}
                height={900}
              />
              <ZoomIn size={22} />
            </button>
            <span className="gallery-caption">
              a little handmade, a lot of heart ♡
            </span>
          </div>
          <div className="photo-thumbnails">
            {p.gallery.map((src, i) => (
              <button
                key={src}
                className={image === i ? "selected" : ""}
                onClick={() => setImage(i)}
                aria-label={`Show ${i === 0 ? "product view" : "original photo"}`}
                aria-pressed={image === i}
              >
                <img src={src} alt="" />
                <span>{i === 0 ? "Product view" : "Original photo"}</span>
              </button>
            ))}
          </div>
          <p className="photo-note">
            Photographed from our own handmade pieces. Some backgrounds have
            been cleaned for clarity.
          </p>
        </motion.div>
        <section className="product-purchase">
          <Link
            className="eyebrow"
            href={`/shop?category=${encodeURIComponent(p.category)}`}
          >
            {p.category}
          </Link>
          <h1>
            {p.name} <span>♡</span>
          </h1>
          <p className="product-tagline">{p.note}.</p>
          <div className="detail-price">
            {money(p.price)} <span>INR</span>
          </div>
          <div className={`stock-label ${available ? "" : "sold-out"}`}>
            <span />
            {available
              ? `${stock} in stock · Ready for a new home`
              : "Out of stock · Ask about the next batch"}
          </div>
          <p className="purchase-intro">{p.description}</p>
          <div className="colour-info">
            <strong>The palette</strong>
            <div>
              {p.colors.map((color) => (
                <span key={color} style={{ background: color }} />
              ))}
            </div>
            <small>
              As pictured · For colour requests,{" "}
              <Link href={`/contact?topic=custom&product=${p.id}`}>
                say hello
              </Link>
            </small>
          </div>
          <div className="purchase-actions">
            <div className="quantity detail-quantity">
              <button
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => q - 1)}
              >
                <Minus size={16} />
              </button>
              <span aria-live="polite">{Math.min(quantity, max || 1)}</span>
              <button
                aria-label="Increase quantity"
                disabled={quantity >= max}
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              className="stitch-button"
              disabled={!available}
              onClick={() => add(p.id, Math.min(quantity, max))}
            >
              <ShoppingBag size={17} /> Add to bag
            </button>
            <button
              className={`save-product icon-button ${liked.includes(p.id) ? "active" : ""}`}
              aria-label={
                liked.includes(p.id) ? "Unsave product" : "Save product"
              }
              aria-pressed={liked.includes(p.id)}
              onClick={() => toggleLike(p.id)}
            >
              <Heart />
            </button>
          </div>
          <button
            className="buy-button"
            disabled={!available}
            onClick={() =>
              router.push(
                `/checkout?buy=${p.id}&quantity=${Math.min(quantity, max)}`,
              )
            }
          >
            Buy this little happiness <ArrowRight size={17} />
          </button>
          <div className="purchase-promises">
            <span>
              <HandHeart size={18} /> Made by hand
            </span>
            <span>
              <MapPin size={18} /> Aditya Surampalem delivery
            </span>
            <span>
              <Check size={18} /> Secure Razorpay checkout
            </span>
          </div>
          <p className="quiet-note">
            Delivery in Aditya Surampalem is included. For supported PIN codes elsewhere, checkout shows the full delivery charge before payment.
          </p>
        </section>
      </div>
      <section className="product-information">
        <div role="tablist" aria-label="Product information">
          {["The little details", "Specifications", "Care & keeping"].map(
            (t) => (
              <button
                role="tab"
                id={`tab-${t.split(" ")[0]}`}
                aria-selected={tab === t}
                aria-controls="product-panel"
                key={t}
                onClick={() => setTab(t)}
                onKeyDown={(e) => {
                  const names = [
                    "The little details",
                    "Specifications",
                    "Care & keeping",
                  ];
                  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    const index =
                      (names.indexOf(t) + (e.key === "ArrowRight" ? 1 : 2)) % 3;
                    setTab(names[index]);
                    document
                      .getElementById(`tab-${names[index].split(" ")[0]}`)
                      ?.focus();
                  }
                }}
                tabIndex={tab === t ? 0 : -1}
              >
                {t}
              </button>
            ),
          )}
        </div>
        <div
          role="tabpanel"
          id="product-panel"
          aria-labelledby={`tab-${tab.split(" ")[0]}`}
          tabIndex={0}
        >
          {tab === "The little details" ? (
            <div className="details-prose">
              <h2>Made slowly. Meant to stay.</h2>
              <p>{p.description}</p>
              <p>
                Every piece is crocheted by hand. Small variations in shape and
                stitching are part of the craft. Our keepsakes are intended for
                gifting, collecting and display.
              </p>
              <Link href="/journey/a-little-care-goes-a-long-way">
                A little guide to keeping it lovely <ArrowRight size={14} />
              </Link>
            </div>
          ) : tab === "Specifications" ? (
            <dl className="spec-list">
              {[
                ...p.details,
                ["Construction", "Hand crocheted"],
                [
                  "Measurements",
                  "Contact us for exact measurements before purchasing",
                ],
                ["Availability", availability({ ...p, stock })],
                ["Delivery", "Aditya Surampalem included; supported PIN codes quoted at checkout"],
              ].map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="details-prose">
              <Leaf size={27} />
              <h2>A gentle kind of love.</h2>
              <p>
                Hand wash gently in cool water with a mild detergent. Avoid
                scrubbing, twisting or wringing. Gently press out water, reshape
                and let air dry flat.
              </p>
              <p>
                Keep crochet away from direct heat. Handle stitched details and
                decorations with care. For mixed-paper gift cards, spot-clean
                the yarn carefully and keep the card dry.
              </p>
            </div>
          )}
        </div>
      </section>
      <section className="related-products">
        <Title sub="A few more little things you might fall for.">
          Good Things Come Together
        </Title>
        <div className="product-grid related-grid">
          {related.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>
      {zoom && (
        <div
          className="photo-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged product photo"
          onClick={() => setZoom(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Tab") setZoom(false);
          }}
        >
          <button
            autoFocus
            aria-label="Close enlarged photo"
            className="icon-button"
            onClick={() => setZoom(false)}
          >
            <X />
          </button>
          <img src={p.gallery[image]} alt={p.name} />
        </div>
      )}
    </main>
  );
}
