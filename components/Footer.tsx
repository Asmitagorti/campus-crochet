import type { Navigate } from "../types";
import { YarnBall, CrochetFlower } from "./YarnDecor";

export default function Footer({
  navigate,
  onCustomOrder,
}: {
  navigate: Navigate;
  onCustomOrder?: () => void;
}) {
  const shopLinks = [
    { label: "All Products", category: "" },
    { label: "Scrunchies", category: "Scrunchies" },
    { label: "Keychains", category: "Keychains" },
    { label: "Charms", category: "Charms" },
    { label: "Bookmarks", category: "Bookmarks" },
    { label: "Bags", category: "Bags" },
  ];

  const infoLinks = [
    {
      label: "Ordering Policy",
      action: () => navigate("home"),
    },
    {
      label: "Custom Orders",
      action: () => onCustomOrder?.(),
    },
    {
      label: "Track My Order",
      action: () => navigate("dashboard"),
    },
    {
      label: "About the Creator",
      action: () => navigate("about"),
    },
  ];

  return (
    <footer
      style={{
        backgroundColor: "#2E1D15",
        color: "#EDD4D4",
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <YarnBall size={28} color="#D8A7A7" />

              <span
                style={{
                  fontFamily:
                    "Playfair Display, Georgia, serif",
                  fontSize: "1.2rem",
                  color: "#F7F3EC",
                  fontWeight: 600,
                }}
              >
                Campus Crochet
              </span>
            </div>

            <p
              style={{
                color: "#B88080",
                fontSize: "0.9rem",
                lineHeight: 1.7,
                maxWidth: 280,
              }}
            >
              Handmade pieces, stitched with love by a
              student. Every order is crocheted after you
              place it — made just for you.
            </p>

            <p
              style={{
                fontFamily: "Caveat, cursive",
                color: "#D8A7A7",
                fontSize: "1.1rem",
                marginTop: "1rem",
              }}
            >
              — Aditya Educational Institutions, Surampalem
            </p>

            <div className="flex gap-3 mt-4">
              <CrochetFlower
                size={24}
                color="#D8A7A7"
              />
              <CrochetFlower
                size={24}
                color="#A8B8A0"
              />
              <CrochetFlower
                size={24}
                color="#B7A7D8"
              />
            </div>
          </div>

          {/* Shop links */}
          <div>
            <h4
              style={{
                color: "#F7F3EC",
                fontWeight: 500,
                fontSize: "0.85rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "1rem",
              }}
            >
              Shop
            </h4>

            <ul
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              {shopLinks.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() =>
                      navigate(
                        "catalog",
                        item.category
                          ? { category: item.category }
                          : undefined
                      )
                    }
                    style={{
                      color: "#B88080",
                      fontSize: "0.875rem",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color =
                        "#D8A7A7")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color =
                        "#B88080")
                    }
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Info links */}
          <div>
            <h4
              style={{
                color: "#F7F3EC",
                fontWeight: 500,
                fontSize: "0.85rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "1rem",
              }}
            >
              Info
            </h4>

            <ul
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              {infoLinks.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={item.action}
                    style={{
                      color: "#B88080",
                      fontSize: "0.875rem",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color =
                        "#D8A7A7")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color =
                        "#B88080")
                    }
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div
          style={{
            borderTop:
              "1px solid rgba(216,167,167,0.15)",
            paddingTop: "1.5rem",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <p
            style={{
              color: "#7A6058",
              fontSize: "0.8rem",
            }}
          >
            © 2026 Campus Crochet · Handmade with love
            at Aditya institutions, Surampalem
          </p>

          <div className="flex items-center gap-4">
            <span
              style={{
                color: "#7A6058",
                fontSize: "0.8rem",
              }}
            >
              Payments secured by
            </span>

            <span
              style={{
                color: "#B88080",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              Razorpay
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

