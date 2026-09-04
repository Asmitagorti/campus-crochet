"use client";

import { useState } from "react";
import type { Navigate } from "@/types";
import { YarnBall, CrochetFlower } from "../YarnDecor";
import { useProducts } from "@/lib/hooks";

const categories = [
  "All",
  "Scrunchies",
  "Keychains",
  "Charms",
  "Bookmarks",
  "Bags",
  "Home",
];

interface CatalogProps {
  navigate: Navigate;
  initialCategory?: string;
  onAddToCart?: (productId: string, color: string, quantity: number) => void;
  onCustomOrder?: () => void;
}

export default function CatalogPage({
  navigate,
  initialCategory,
  onAddToCart,
  onCustomOrder,
}: CatalogProps) {
  const { products, loading } = useProducts();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(
    initialCategory && categories.includes(initialCategory)
      ? initialCategory
      : "All"
  );
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  function addToCart(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const product = products.find((p) => p.id === id);
    if (product && onAddToCart) {
      onAddToCart(id, product.colors[0] || "Default", 1);
    }
    setAdded(id);
    setTimeout(() => setAdded(null), 2000);
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#FFFDF8" }}>
      <div
        style={{
          backgroundColor: "#F7F3EC",
          borderBottom: "1px solid #EDD4D4",
          padding: "3rem 0 2rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", right: "5%", top: "-10%", opacity: 0.15 }}>
          <YarnBall size={140} color="#D8A7A7" />
        </div>
        <div style={{ position: "absolute", left: "2%", bottom: "-20%", opacity: 0.1 }}>
          <CrochetFlower size={80} color="#A8B8A0" />
        </div>

        <div className="max-w-[1200px] mx-auto px-6">
          <p
            style={{
              fontFamily: "Caveat, cursive",
              color: "#C97B63",
              fontSize: "1.05rem",
              marginBottom: "0.5rem",
            }}
          >
            Handcrafted with love
          </p>
          <h1
            style={{
              fontFamily: "Playfair Display, Georgia, serif",
              fontSize: "2.5rem",
              fontWeight: 700,
              color: "#2E1D15",
              marginBottom: "1.5rem",
            }}
          >
            The Collection
          </h1>

          <div style={{ position: "relative", maxWidth: 400 }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7A6058"
              strokeWidth="1.8"
              strokeLinecap="round"
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search pieces..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem 0.75rem 0.6rem 2.5rem",
                borderRadius: 50,
                border: "1.5px solid #EDD4D4",
                backgroundColor: "#FFFDF8",
                color: "#2E1D15",
                fontSize: "0.9rem",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#C97B63")}
              onBlur={(e) => (e.target.style.borderColor = "#EDD4D4")}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          borderBottom: "1px solid #EDD4D4",
          backgroundColor: "#FFFDF8",
          position: "sticky",
          top: 64,
          zIndex: 40,
          padding: "0.75rem 0",
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6">
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  flexShrink: 0,
                  padding: "0.4rem 1.1rem",
                  borderRadius: 50,
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  border:
                    activeCategory === cat
                      ? "1.5px solid #C97B63"
                      : "1.5px solid #EDD4D4",
                  backgroundColor: activeCategory === cat ? "#C97B63" : "#FFFDF8",
                  color: activeCategory === cat ? "#FFFDF8" : "#7A6058",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#7A6058" }}>
            <CrochetFlower size={48} color="#EDD4D4" />
            <p
              style={{
                fontFamily: "Playfair Display, Georgia, serif",
                fontSize: "1.25rem",
                marginTop: "1rem",
                marginBottom: "0.5rem",
                color: "#2E1D15",
              }}
            >
              Loading the collectionâ€¦
            </p>
            <p style={{ fontSize: "0.9rem" }}>Fetching handmade pieces from Supabase.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#7A6058" }}>
            <CrochetFlower size={48} color="#EDD4D4" />
            <p
              style={{
                fontFamily: "Playfair Display, Georgia, serif",
                fontSize: "1.25rem",
                marginTop: "1rem",
                marginBottom: "0.5rem",
                color: "#2E1D15",
              }}
            >
              No pieces found
            </p>
            <p style={{ fontSize: "0.9rem" }}>
              Try a different search or category â€” or request a custom piece.
            </p>
          </div>
        ) : (
          <>
            <p style={{ color: "#7A6058", fontSize: "0.82rem", marginBottom: "1.5rem" }}>
              {filtered.length} piece{filtered.length !== 1 ? "s" : ""} Â· all handmade
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 32,
              }}
            >
              {filtered.map((p) => (
                <div
                  key={p.id}
                  style={{
                    backgroundColor: "#F7F3EC",
                    borderRadius: 24,
                    overflow: "hidden",
                    border: "1px solid #EDD4D4",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    transform: hoverId === p.id ? "translateY(-4px)" : "none",
                    boxShadow:
                      hoverId === p.id ? "0 16px 40px rgba(46,29,21,0.1)" : "none",
                  }}
                  onMouseEnter={() => setHoverId(p.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => navigate("product", { id: p.id })}
                >
                  <div
                    style={{
                      position: "relative",
                      aspectRatio: "4/5",
                      backgroundColor: "#EDD4D4",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.3s",
                        transform: hoverId === p.id ? "scale(1.04)" : "scale(1)",
                      }}
                    />

                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {p.badge && (
                        <span
                          style={{
                            backgroundColor: "#C97B63",
                            color: "#FFFDF8",
                            fontSize: "0.68rem",
                            fontWeight: 600,
                            padding: "0.22rem 0.55rem",
                            borderRadius: 50,
                            letterSpacing: "0.04em",
                          }}
                        >
                          {p.badge}
                        </span>
                      )}
                      <span
                        style={{
                          backgroundColor: "rgba(255,253,248,0.9)",
                          color: "#7A6058",
                          fontSize: "0.68rem",
                          fontWeight: 500,
                          padding: "0.22rem 0.55rem",
                          borderRadius: 50,
                        }}
                      >
                        Handmade
                      </span>
                    </div>

                    <button
                      onClick={(e) => addToCart(p.id, e)}
                      style={{
                        position: "absolute",
                        bottom: 12,
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: added === p.id ? "#A8B8A0" : "#2E1D15",
                        color: "#FFFDF8",
                        fontSize: "0.78rem",
                        fontWeight: 500,
                        padding: "0.45rem 1.1rem",
                        borderRadius: 50,
                        border: "none",
                        cursor: "pointer",
                        opacity: hoverId === p.id ? 1 : 0,
                        transition: "opacity 0.2s, background-color 0.2s",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {added === p.id ? "âœ“ Added to cart" : "+ Add to cart"}
                    </button>
                  </div>

                  <div style={{ padding: "1.25rem 1.25rem 1.5rem" }}>
                    <p
                      style={{
                        fontFamily: "Playfair Display, Georgia, serif",
                        fontWeight: 600,
                        fontSize: "1.05rem",
                        color: "#2E1D15",
                        marginBottom: 2,
                      }}
                    >
                      {p.name}
                    </p>
                    <p style={{ color: "#7A6058", fontSize: "0.78rem", marginBottom: "0.75rem" }}>
                      {p.category}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "#C97B63" }}>
                        â‚¹{p.price}
                      </span>
                      <div style={{ display: "flex", gap: 4 }}>
                        {p.colors.slice(0, 2).map((c) => (
                          <span
                            key={c}
                            style={{
                              fontSize: "0.68rem",
                              color: "#8B6B5C",
                              backgroundColor: "#FFFDF8",
                              padding: "0.12rem 0.4rem",
                              borderRadius: 4,
                              border: "1px solid #EDD4D4",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "#A8B8A0",
                        marginTop: "0.5rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span>3â€“5 working days</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div
        style={{
          backgroundColor: "#F7F3EC",
          padding: "2rem 0",
          borderTop: "1px solid #EDD4D4",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "Caveat, cursive",
            color: "#7A6058",
            fontSize: "1.1rem",
            marginBottom: "0.5rem",
          }}
        >
          Don't see what you're looking for?
        </p>
        <button
          onClick={() => onCustomOrder?.()}
          style={{
            color: "#C97B63",
            fontWeight: 600,
            fontSize: "0.9rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          Request a custom piece âœ¨
        </button>
      </div>
    </main>
  );
}