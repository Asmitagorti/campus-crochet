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
import ProductPrice from "./product-price";
import { Title } from "./design";
import { productGallery } from "@/lib/personalization";
export default function ProductDetail({ product: p }: { product: Product }) {
  const { add, liked, toggleLike, catalog: products } = useShop(),
    router = useRouter();
  const [quantity, setQuantity] = useState(1),
    [image, setImage] = useState(0),
    [selectedColor, setSelectedColor] = useState(p.colorOptions?.[0]?.name || "As pictured"),
    [tab, setTab] = useState("The little details"),
    [zoom, setZoom] = useState(false);
  const max = maxQuantity(p);
  const gallery = productGallery(p, selectedColor);
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
                src={gallery[image] || gallery[0]}
                alt={`${p.name}${p.colorOptions?.length ? ` in ${selectedColor}` : ""}, photo ${image + 1}`}
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
            {gallery.map((src, i) => (
              <button
                key={src}
                className={image === i ? "selected" : ""}
                onClick={() => setImage(i)}
                aria-label={`Show ${p.name} photo ${i + 1}`}
                aria-pressed={image === i}
              >
                <img src={src} alt="" />
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
            <ProductPrice product={p} />
          </div>
          <div className="stock-label">
            <span />
            Made to order · Crocheted after you order
          </div>
          <p className="purchase-intro">{p.description}</p>
          <div className="personalization-promise"><strong>Make it personal ♡</strong>
            <p>Add the recipient’s name, an occasion and a complimentary handwritten message at checkout. Each piece can have its own gift details.</p></div>
          {(p.colorOptions?.length || 0) > 0 ? <div className="product-colour-choices">
            <strong>Choose your colour</strong><p>See each finished colour and pick yours before adding it to your bag.</p>
            <div>{p.colorOptions!.map((option) => <button type="button" key={option.name}
              className={selectedColor === option.name ? "selected" : ""} onClick={() => { setSelectedColor(option.name); setImage(0); }}
              aria-label={`Choose ${p.name} in ${option.name}`} aria-pressed={selectedColor === option.name}>
              <img src={option.image} alt="" /><span>{option.name}</span></button>)}</div>
          </div> : <p className="product-fixed-colour">Colour as pictured · Add gift details at checkout.</p>}
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
              onClick={() => add(p.id, Math.min(quantity, max), selectedColor)}
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
            onClick={() =>
              router.push(
                `/checkout?buy=${p.id}&quantity=${Math.min(quantity, max)}&color=${encodeURIComponent(selectedColor)}`,
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
              <Check size={18} /> Secure Razorpay checkout
            </span>
          </div>
          <p className="quiet-note">
            Made to order with free shipping. Dispatch in 5–7 working days.
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
                ["Availability", availability(p)],
                ["Delivery", "Free shipping; made to order, dispatched in 5–7 working days"],
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
          <img src={gallery[image] || gallery[0]} alt={p.name} />
        </div>
      )}
    </main>
  );
}
