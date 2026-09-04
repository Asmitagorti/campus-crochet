"use client";

import { useEffect, useState } from "react";
import type { Navigate, Product } from "@/types";
import { CheckShieldIcon, CrochetFlower } from "../YarnDecor";
import { useProducts } from "@/lib/hooks";

interface Props {
  navigate: Navigate;
  productId: string | null;
  onAddToCart?: (productId: string, color: string, quantity: number) => void;
}

const fallbackPrev = [
  {
    img: "https://images.unsplash.com/photo-1700171394718-2457b1190444?w=300&h=375&fit=crop&auto=format",
    college: "ACET",
    color: "Sage Green",
    date: "Aug 2026",
  },
  {
    img: "https://images.unsplash.com/photo-1700171458554-46cfd3f2a87a?w=300&h=375&fit=crop&auto=format",
    college: "AEC",
    color: "Dusty Rose",
    date: "Jul 2026",
  },
  {
    img: "https://images.unsplash.com/photo-1700171518313-5dd219beaaa6?w=300&h=375&fit=crop&auto=format",
    college: "ACET",
    color: "Cream White",
    date: "Jun 2026",
  },
];

export default function ProductDetailPage({ navigate, productId, onAddToCart }: Props) {
  const { products, loading } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [expandedCare, setExpandedCare] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (loading) return;
    const found = products.find((p) => p.id === productId) ?? products[0];
    if (!found) return;
    setProduct(found);
    setSelectedColor(found.colors?.[0] ?? "");
  }, [products, productId, loading]);

  useEffect(() => {
    if (!product) return;

    async function loadImages() {
      try {
        const res = await fetch(`/api/products`);
        if (!res.ok) return;
        const rows = await res.json();
        const row = rows.find((r: any) => r.id === product!.id);
        if (!row) return;
        const images =
          row.product_images
            ?.sort(
              (a: any, b: any) =>
                (a.display_order ?? 0) - (b.display_order ?? 0)
            )
            .map((img: any) => img.image_url) ?? [];
        setExtraImages(images);
      } catch (e) {
        console.error("loadImages error:", e);
      }
    }

    loadImages();
  }, [product?.id]);

  if (loading) {
    return (
      <main
        style={{
          minHeight: "60vh",
          backgroundColor: "#FFFDF8",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.25rem",
          padding: "4rem 1.5rem",
          textAlign: "center",
        }}
      >
        <CrochetFlower size={48} color="#EDD4D4" />
        <p style={{ color: "#7A6058", fontSize: "0.95rem" }}>Loading productâ€¦</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main
        style={{
          minHeight: "60vh",
          backgroundColor: "#FFFDF8",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.25rem",
          padding: "4rem 1.5rem",
          textAlign: "center",
        }}
      >
        <CrochetFlower size={48} color="#EDD4D4" />
        <p
          style={{
            fontFamily: "Playfair Display, Georgia, serif",
            fontSize: "1.25rem",
            color: "#2E1D15",
          }}
        >
          Product not found
        </p>
        <button
          onClick={() => navigate("catalog")}
          style={{
            backgroundColor: "#C97B63",
            color: "#FFFDF8",
            fontWeight: 600,
            padding: "0.65rem 1.5rem",
            borderRadius: 50,
            border: "none",
            cursor: "pointer",
            fontSize: "0.88rem",
          }}
        >
          Back to collection
        </button>
      </main>
    );
  }

  const allImages =
    extraImages.length > 0
      ? extraImages
      : product.image
      ? [product.image]
      : [];

  const currentImage = allImages[activeImg] ?? product.image ?? "";

  function handleBuyNow() {
    setOrderSuccess(true);
    setTimeout(() => {
      setOrderSuccess(false);
      if (onAddToCart) onAddToCart(product!.id, selectedColor, quantity);
      navigate("payment");
    }, 1200);
  }

  return (
    <main style={{ backgroundColor: "#FFFDF8", minHeight: "100vh" }}>
      {orderSuccess && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(247,243,236,0.96)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
          }}
        >
          <div style={{ fontSize: "3rem", animation: "bounce 0.6s ease infinite alternate" }}>
            ðŸ§¶
          </div>
          <h2
            style={{
              fontFamily: "Playfair Display, Georgia, serif",
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "#2E1D15",
              textAlign: "center",
            }}
          >
            Adding to your cart ðŸ§¶
          </h2>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div
          style={{
            display: "flex",
            gap: 8,
            fontSize: "0.8rem",
            color: "#7A6058",
            marginBottom: "2.5rem",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => navigate("home")}
            style={{ color: "#7A6058", background: "none", border: "none", cursor: "pointer" }}
          >
            Home
          </button>
          <span>/</span>
          <button
            onClick={() => navigate("catalog")}
            style={{ color: "#7A6058", background: "none", border: "none", cursor: "pointer" }}
          >
            Collection
          </button>
          <span>/</span>
          <span style={{ color: "#2E1D15", fontWeight: 500 }}>{product.name}</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "5rem",
            alignItems: "start",
          }}
        >
          <div>
            <div
              style={{
                borderRadius: 24,
                overflow: "hidden",
                aspectRatio: "4/5",
                backgroundColor: "#F7F3EC",
                border: "1px solid #EDD4D4",
                marginBottom: "0.75rem",
              }}
            >
              <img
                src={currentImage}
                alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.2s" }}
              />
            </div>
            {allImages.length > 1 && (
              <div style={{ display: "flex", gap: 10 }}>
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      width: 72,
                      aspectRatio: "4/5",
                      border: activeImg === i ? "2px solid #C97B63" : "2px solid transparent",
                      flexShrink: 0,
                      cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {product.badge && (
              <span
                style={{
                  backgroundColor: "#C97B63",
                  color: "#FFFDF8",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  padding: "0.25rem 0.75rem",
                  borderRadius: 50,
                  letterSpacing: "0.04em",
                  display: "inline-block",
                  marginBottom: "0.75rem",
                }}
              >
                {product.badge}
              </span>
            )}

            <h1
              style={{
                fontFamily: "Playfair Display, Georgia, serif",
                fontSize: "2.25rem",
                fontWeight: 700,
                color: "#2E1D15",
                lineHeight: 1.2,
                marginBottom: "0.5rem",
              }}
            >
              {product.name}
            </h1>
            <p style={{ color: "#7A6058", fontSize: "0.9rem", marginBottom: "1rem" }}>
              {product.category}
            </p>
            <p
              style={{ fontWeight: 700, fontSize: "1.75rem", color: "#C97B63", marginBottom: "1.5rem" }}
            >
              ₹{product.price}
            </p>

            <p style={{ color: "#5A4238", lineHeight: 1.8, fontSize: "0.92rem", marginBottom: "1.75rem" }}>
              {product.description}
            </p>

            {product.colors.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#2E1D15", marginBottom: "0.6rem" }}>
                  Color: <span style={{ color: "#7A6058", fontWeight: 400 }}>{selectedColor}</span>
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      style={{
                        padding: "0.4rem 0.9rem",
                        borderRadius: 50,
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        border: selectedColor === c ? "2px solid #C97B63" : "1.5px solid #EDD4D4",
                        backgroundColor: selectedColor === c ? "#FDF0EC" : "#FFFDF8",
                        color: selectedColor === c ? "#C97B63" : "#7A6058",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: "1.75rem" }}>
              <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#2E1D15", marginBottom: "0.6rem" }}>
                Quantity
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  border: "1.5px solid #EDD4D4",
                  borderRadius: 50,
                  width: "fit-content",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ padding: "0.4rem 0.9rem", fontSize: "1.1rem", color: "#7A6058", background: "none", border: "none", cursor: "pointer" }}
                >
                  −
                </button>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#2E1D15", minWidth: 20, textAlign: "center" }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(20, quantity + 1))}
                  style={{ padding: "0.4rem 0.9rem", fontSize: "1.1rem", color: "#7A6058", background: "none", border: "none", cursor: "pointer" }}
                >
                  +
                </button>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#F7F3EC",
                borderRadius: 12,
                padding: "0.75rem 1rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A8B8A0" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <p style={{ fontSize: "0.82rem", color: "#7A6058" }}>
                Made after your order · <strong style={{ color: "#2E1D15" }}>3–5 working days</strong> processing time
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: "2rem" }}>
              <button
                onClick={() => {
                  if (onAddToCart) onAddToCart(product.id, selectedColor, quantity);
                  navigate("cart");
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#F7F3EC",
                  color: "#2E1D15",
                  fontWeight: 600,
                  padding: "0.875rem",
                  borderRadius: 50,
                  border: "1.5px solid #EDD4D4",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#C97B63")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#EDD4D4")}
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                style={{
                  flex: 1,
                  backgroundColor: "#C97B63",
                  color: "#FFFDF8",
                  fontWeight: 600,
                  padding: "0.875rem",
                  borderRadius: 50,
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  transition: "background-color 0.2s",
                  boxShadow: "0 4px 16px rgba(201,123,99,0.3)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#A86248")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#C97B63")}
              >
                Buy Now
              </button>
            </div>

            <div style={{ borderTop: "1px solid #EDD4D4", paddingTop: "1.25rem", marginBottom: "1.25rem" }}>
              <button
                onClick={() => setExpandedCare((v) => !v)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.5rem 0",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#2E1D15" }}>Care instructions</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#7A6058"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  style={{ transform: expandedCare ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                >
                  <polyline points="6 9 12 15  18 9" />
                </svg>
              </button>
              {expandedCare && (
                <p style={{ color: "#7A6058", fontSize: "0.85rem", lineHeight: 1.7, paddingTop: "0.5rem" }}>
                  {product.care}
                </p>
              )}
            </div>

            <div style={{ backgroundColor: "#2E1D15", borderRadius: 16, padding: "1.25rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <CheckShieldIcon size={22} color="#A8B8A0" />
                <div>
                  <p style={{ fontWeight: 600, color: "#F7F3EC", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                    85% Similarity Guarantee
                  </p>
                  <p style={{ color: "#B88080", fontSize: "0.78rem", lineHeight: 1.6 }}>
                    Your piece will be at least 85% visually similar to the listing photos. Tiny variations are part of the handmade charm.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section style={{ marginTop: 96 }}>
          <div style={{ marginBottom: 36 }}>
            <p style={{ fontFamily: "Caveat, cursive", color: "#A8B8A0", fontSize: "1.05rem", marginBottom: "0.4rem" }}>
              Real completed versions
            </p>
            <h2
              style={{
                fontFamily: "Playfair Display, Georgia, serif",
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "#2E1D15",
              }}
            >
              See previous handmade versions
            </h2>
            <p style={{ color: "#7A6058", fontSize: "0.88rem", marginTop: "0.4rem" }}>
              These are real orders that were made, photographed, and delivered. Every piece is slightly unique.
            </p>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}
          >
            {fallbackPrev.map((v, i) => (
              <div
                key={i}
                style={{ borderRadius: 20, overflow: "hidden", backgroundColor: "#F7F3EC", border: "1px solid #EDD4D4" }}
              >
                <div style={{ aspectRatio: "4/5", backgroundColor: "#EDD4D4", overflow: "hidden" }}>
                  <img src={v.img} alt="Previous version" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: "1rem" }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 600, padding: "0.2rem 0.5rem", borderRadius: 50, backgroundColor: "#C8D8C0", color: "#3A6B3A" }}>
                      Completed
                    </span>
                    <span style={{ fontSize: "0.65rem", fontWeight: 600, padding: "0.2rem 0.5rem", borderRadius: 50, backgroundColor: "#EDD4D4", color: "#8B4A3A" }}>
                      Real order
                    </span>
                  </div>
                  <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#2E1D15" }}>{v.color}</p>
                  <p style={{ fontFamily: "Caveat, cursive", color: "#7A6058", fontSize: "0.9rem" }}>
                    {v.college} · {v.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {products.length > 1 && (
          <section style={{ marginTop: 96 }}>
            <h2
              style={{
                fontFamily: "Playfair Display, Georgia, serif",
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "#2E1D15",
                marginBottom: 32,
              }}
            >
              You might also like
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
              {products.filter((p) => p.id !== product.id).slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  style={{
                    borderRadius: 20,
                    overflow: "hidden",
                    backgroundColor: "#F7F3EC",
                    border: "1px solid #EDD4D4",
                    cursor: "pointer",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
                  onClick={() => navigate("product", { id: p.id })}
                >
                  <div style={{ aspectRatio: "4/5", backgroundColor: "#EDD4D4", overflow: "hidden" }}>
                    <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: "1rem" }}>
                    <p
                      style={{
                        fontFamily: "Playfair Display, Georgia, serif",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        color: "#2E1D15",
                      }}
                    >
                      {p.name}
                    </p>
                    <p style={{ color: "#C97B63", fontWeight: 700, marginTop: 4 }}>₹{p.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          from { transform: translateY(0) rotate(0deg); }
          to { transform: translateY(-12px) rotate(15deg); }
        }
      `}</style>
    </main>
  );
}