"use client";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { motion } from "motion/react";
import { Product, photo, money, availability, canOrder } from "@/lib/catalog";
import { useShop } from "./site-shell";
export function ProductCard({
  product: p,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const { liked, toggleLike, add } = useShop();
  return (
    <motion.article
      layout
      className="product-card"
      style={{ "--tilt": `${index % 2 ? 1 : -1}deg` } as React.CSSProperties}
    >
      <div className="product-image">
        <Link
          className="image-open"
          href={`/products/${p.id}`}
          aria-label={`View ${p.name}`}
        >
          <img
            src={p.gallery[0]}
            alt={p.name}
            loading="lazy"
            width={400}
            height={410}
          />
        </Link>
        <button
          className={`favourite ${liked.includes(p.id) ? "is-liked" : ""}`}
          aria-label={`${liked.includes(p.id) ? "Unsave" : "Save"} ${p.name}`}
          aria-pressed={liked.includes(p.id)}
          onClick={() => toggleLike(p.id)}
        >
          <Heart size={19} />
        </button>
      </div>
      <Link className="product-name" href={`/products/${p.id}`}>
        {p.name}
      </Link>
      <p>{p.note}</p>
      <div className="card-price">{money(p.price)}</div>
      <span className="price-note">{availability(p)}</span>
      <button
        disabled={!canOrder(p)}
        className="small-button"
        onClick={() => add(p.id)}
      >
        {canOrder(p) ? "Add to bag" : "Out of stock"} <Plus size={12} />
      </button>
    </motion.article>
  );
}
