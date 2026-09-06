"use client";

import { useEffect, useMemo, useState } from "react";
import type { Navigate, AuthUser, CustomRequest, Order } from "@/types";
import { CrochetFlower } from "../YarnDecor";
import { useOrdersForUser, useOrderRealtime } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";

interface Props {
  navigate: Navigate;
  user: AuthUser | null;
  onLoginClick: () => void;
}

const statusSteps = [
  { key: "payment_received", label: "Payment received", icon: "ðŸ’³" },
  { key: "yarn_selected", label: "Yarn selected", icon: "ðŸ§¶" },
  { key: "crocheting", label: "Crocheting", icon: "ðŸª¡" },
  { key: "quality_check", label: "Quality check", icon: "âœ…" },
  { key: "ready", label: "Ready for pickup", icon: "ðŸ“¦" },
  { key: "completed", label: "Completed", icon: "ðŸŽ‰" },
];

const statusOrder = statusSteps.map((s) => s.key);

const customStatusMeta: Record<string, { label: string; tone: string }> = {
  pending: { label: "Pending review", tone: "#EDD4D4" },
  accepted: { label: "Accepted", tone: "#C8D8C0" },
  rejected: { label: "Rejected", tone: "#D8A7A7" },
  counter_offered: { label: "Counter offer sent", tone: "#FDE9CC" },
  student_accepted: { label: "Student accepted", tone: "#A8D4C8" },
  paid: { label: "Paid", tone: "#D4C8EE" },
  in_production: { label: "In production", tone: "#FDE9CC" },
  ready: { label: "Ready for pickup", tone: "#A8D4C8" },
  completed: { label: "Completed", tone: "#2E1D15" },
};

export default function CustomerDashboard({
  navigate,
  user,
  onLoginClick,
}: Props) {
  if (!user) {
    return (
      <main
        style={{
          minHeight: "70vh",
          backgroundColor: "#FFFDF8",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "3rem 1.5rem",
          gap: "1rem",
        }}
      >
        <div style={{ fontSize: "2.5rem" }}>ðŸ”</div>
        <h2
          style={{
            fontFamily: "Playfair Display, Georgia, serif",
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "#2E1D15",
          }}
        >
          Track Your Orders
        </h2>
        <p
          style={{
            color: "#7A6058",
            maxWidth: 340,
            lineHeight: 1.7,
            fontSize: "0.9rem",
          }}
        >
          Sign in with your college email to see the status of your handmade pieces.
        </p>
        <button
          onClick={onLoginClick}
          style={{
            backgroundColor: "#C97B63",
            color: "#FFFDF8",
            fontWeight: 600,
            padding: "0.75rem 2rem",
            borderRadius: 50,
            border: "none",
            cursor: "pointer",
            fontSize: "0.9rem",
            boxShadow: "0 4px 14px rgba(201,123,99,0.28)",
            marginTop: "0.5rem",
          }}
        >
          Sign in to continue â†’
        </button>
        <button
          onClick={() => navigate("catalog")}
          style={{
            color: "#7A6058",
            fontSize: "0.85rem",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Browse the collection first
        </button>
      </main>
    );
  }

  return <DashboardContent navigate={navigate} user={user} />;
}

function DashboardContent({
  navigate,
  user,
}: {
  navigate: Navigate;
  user: AuthUser;
}) {
  const { orders, loading: ordersLoading } = useOrdersForUser(user.id);
  const realtime = useOrderRealtime(user.id);
  const [customRequests, setCustomRequests] = useState<CustomRequest[]>([]);
  const [customLoading, setCustomLoading] = useState(true);
  const [tab, setTab] = useState<"orders" | "custom">("orders");

  // Apply realtime status updates to the local orders state
  const liveOrders = useMemo(() => {
    if (!realtime) return orders;
    return orders.map((o) =>
      o.id === realtime.id ? { ...o, order_status: realtime.status as Order["order_status"] } : o
    );
  }, [orders, realtime]);

  useEffect(() => {
    if (!user.id) return;
    let mounted = true;
    async function loadCustom() {
      setCustomLoading(true);
      try {
        const res = await fetch(`/api/custom-requests?user_id=${user.id}`);
        if (!res.ok) return;
        const data = (await res.json()) ?? [];
        if (mounted) setCustomRequests(data);
      } catch (e) {
        console.error("loadCustomRequests error:", e);
      } finally {
        if (mounted) setCustomLoading(false);
      }
    }
    loadCustom();

    const channel = supabase
      .channel(`custom-requests-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "custom_requests",
          filter: `user_id=eq.${user.id}`,
        },
        () => loadCustom()
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const activeOrders = liveOrders.filter(
    (o) => o.order_status !== "completed" && o.order_status !== "ready"
  );
  const completedOrders = liveOrders.filter((o) => o.order_status === "completed");
  const readyOrders = liveOrders.filter((o) => o.order_status === "ready");
  const pendingCustom = customRequests.filter(
    (r) => r.status !== "completed" && r.status !== "rejected"
  );

  async function acceptCounterOffer(req: CustomRequest) {
    try {
      const res = await fetch("/api/custom-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: req.id,
          status: "student_accepted",
          student_response: "accepted",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to accept");
      }
    } catch (e: any) {
      alert(e?.message ?? "Failed to accept");
    }
  }

  async function promoteRequest(req: CustomRequest) {
    if (!confirm("Promote this accepted custom request to a real order?")) return;
    try {
      const res = await fetch(`/api/custom-requests/${req.id}/promote`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to promote");
        return;
      }
      alert("Custom order promoted. Redirecting to payment flowâ€¦");
      navigate("dashboard");
    } catch (e: any) {
      alert(e?.message ?? "Failed to promote");
    }
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#FFFDF8" }}>
      <div
        style={{
          backgroundColor: "#F7F3EC",
          borderBottom: "1px solid #EDD4D4",
          padding: "2.5rem 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="max-w-[1200px] mx-auto px-6"
          style={{ position: "relative" }}
        >
          <p
            style={{
              fontFamily: "Caveat, cursive",
              color: "#C97B63",
              fontSize: "1.1rem",
              marginBottom: "0.3rem",
            }}
          >
            Welcome back, {user.name} ðŸŒ¸
          </p>
          <h1
            style={{
              fontFamily: "Playfair Display, Georgia, serif",
              fontSize: "2rem",
              fontWeight: 700,
              color: "#2E1D15",
            }}
          >
            Your Orders
          </h1>
          <p
            style={{
              color: "#7A6058",
              fontSize: "0.9rem",
              marginTop: "0.35rem",
            }}
          >
            Track your handmade pieces from queue to campus pickup.
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
          <button
            onClick={() => setTab("orders")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: 50,
              fontSize: "0.82rem",
              fontWeight: 600,
              border: tab === "orders" ? "1.5px solid #C97B63" : "1.5px solid #EDD4D4",
              backgroundColor: tab === "orders" ? "#C97B63" : "#FFFDF8",
              color: tab === "orders" ? "#FFFDF8" : "#7A6058",
              cursor: "pointer",
            }}
          >
            Orders ({liveOrders.length})
          </button>
          <button
            onClick={() => setTab("custom")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: 50,
              fontSize: "0.82rem",
              fontWeight: 600,
              border: tab === "custom" ? "1.5px solid #C97B63" : "1.5px solid #EDD4D4",
              backgroundColor: tab === "custom" ? "#C97B63" : "#FFFDF8",
              color: tab === "custom" ? "#FFFDF8" : "#7A6058",
              cursor: "pointer",
            }}
          >
            Custom Requests ({customRequests.length})
          </button>
        </div>

        {tab === "orders" ? (
          <OrdersTab
            loading={ordersLoading}
            activeOrders={activeOrders}
            readyOrders={readyOrders}
            completedOrders={completedOrders}
            navigate={navigate}
          />
        ) : (
          <CustomRequestsTab
            loading={customLoading}
            requests={customRequests}
            onAcceptCounterOffer={acceptCounterOffer}
            onPromote={promoteRequest}
          />
        )}

        {pendingCustom.length === 0 &&
          customRequests.length === 0 &&
          liveOrders.length === 0 &&
          !ordersLoading &&
          !customLoading && (
            <div
              style={{
                textAlign: "center",
                padding: "3rem 0",
                color: "#7A6058",
              }}
            >
              <CrochetFlower size={40} color="#EDD4D4" />
              <p
                style={{
                  fontFamily: "Playfair Display, Georgia, serif",
                  fontSize: "1.25rem",
                  marginTop: "1rem",
                  marginBottom: "0.5rem",
                  color: "#2E1D15",
                }}
              >
                No orders yet
              </p>
              <p style={{ fontSize: "0.9rem" }}>
                Browse the collection or ask the AI assistant to find something for you.
              </p>
              <button
                onClick={() => navigate("catalog")}
                style={{
                  marginTop: "1rem",
                  backgroundColor: "#C97B63",
                  color: "#FFFDF8",
                  fontWeight: 600,
                  padding: "0.6rem 1.5rem",
                  borderRadius: 50,
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                Browse Collection
              </button>
            </div>
          )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </main>
  );
}

function OrdersTab({
  loading,
  activeOrders,
  readyOrders,
  completedOrders,
  navigate,
}: {
  loading: boolean;
  activeOrders: Order[];
  readyOrders: Order[];
  completedOrders: Order[];
  navigate: Navigate;
}) {
  if (loading) {
    return (
      <p style={{ color: "#7A6058", fontSize: "0.9rem" }}>Loading ordersâ€¦</p>
    );
  }

  if (activeOrders.length === 0 && readyOrders.length === 0 && completedOrders.length === 0) {
    return null;
  }

  return (
    <>
      {activeOrders.map((order) => (
        <OrderCard key={order.order_id || order.id} order={order} />
      ))}

      {readyOrders.length > 0 && (
        <section style={{ marginBottom: 64 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>ðŸ“¦</span>
            <h2
              style={{
                fontFamily: "Playfair Display, Georgia, serif",
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "#2E1D15",
              }}
            >
              Ready for pickup
            </h2>
          </div>
          {readyOrders.map((order) => (
            <OrderCard key={order.order_id || order.id} order={order} />
          ))}
        </section>
      )}

      {completedOrders.length > 0 && (
        <section>
          <h2
            style={{
              fontFamily: "Playfair Display, Georgia, serif",
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#2E1D15",
              marginBottom: 16,
            }}
          >
            Completed
          </h2>
          {completedOrders.map((order) => (
            <OrderCard key={order.order_id || order.id} order={order} compact />
          ))}
        </section>
      )}
    </>
  );
}

function OrderCard({ order, compact }: { order: Order; compact?: boolean }) {
  const currentIdx = statusOrder.indexOf(order.order_status);
  const item = order.order_items?.[0];
  const product = item?.products;
  const image = product?.image ?? "";

  return (
    <div
      style={{
        backgroundColor: "#F7F3EC",
        borderRadius: 24,
        border: "1px solid #EDD4D4",
        overflow: "hidden",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "80px 1fr 1fr",
          gap: "1.5rem",
          padding: "1.5rem",
          borderBottom: "1px solid #EDD4D4",
          alignItems: "center",
        }}
      >
        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            aspectRatio: "4/5",
            backgroundColor: "#EDD4D4",
          }}
        >
          {image && (
            <img
              src={image}
              alt={product?.name ?? "Order"}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </div>
        <div>
          <p
            style={{
              fontFamily: "Playfair Display, Georgia, serif",
              fontWeight: 600,
              fontSize: "1.05rem",
              color: "#2E1D15",
              marginBottom: 4,
            }}
          >
            {product?.name ?? "Custom order"}
          </p>
          <p style={{ color: "#7A6058", fontSize: "0.82rem" }}>
            {item?.selected_color ? `${item.selected_color} · ` : ""}₹{item?.price_at_purchase ?? order.total_price}
          </p>
          <p style={{ color: "#7A6058", fontSize: "0.78rem", marginTop: 2 }}>
            Order #{(order.order_id || order.id || "").slice(0, 8)} ·{" "}
            {new Date(order.ordered_at ?? new Date().toISOString()).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "#C97B63" }}>
            ₹{order.total_price}
          </p>
          <span
            style={{
              display: "inline-block",
              backgroundColor: "#C97B63",
              color: "#FFFDF8",
              fontSize: "0.7rem",
              fontWeight: 600,
              padding: "0.25rem 0.6rem",
              borderRadius: 50,
              marginTop: 6,
              textTransform: "capitalize",
            }}
          >
            {order.order_status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {!compact && currentIdx >= 0 && (
        <div style={{ padding: "1.5rem 2rem" }}>
          <p
            style={{
              fontWeight: 600,
              color: "#2E1D15",
              fontSize: "0.9rem",
              marginBottom: "1rem",
            }}
          >
            Order progress
          </p>
          <div style={{ display: "flex", gap: 0, alignItems: "flex-start" }}>
            {statusSteps.map((step, i) => {
              const done = i <= currentIdx;
              const current = i === currentIdx;
              return (
                <div
                  key={step.key}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    position: "relative",
                  }}
                >
                  {i < statusSteps.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 20,
                        left: "50%",
                        width: "100%",
                        height: 2,
                        backgroundColor: done && i < currentIdx ? "#A8B8A0" : "#EDD4D4",
                        zIndex: 0,
                      }}
                    />
                  )}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      backgroundColor: done ? (current ? "#C97B63" : "#A8B8A0") : "#FFFDF8",
                      border: `2px solid ${done ? (current ? "#C97B63" : "#A8B8A0") : "#EDD4D4"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.9rem",
                      zIndex: 1,
                      position: "relative",
                    }}
                  >
                    {done ? (current ? step.icon : "âœ“") : i + 1}
                  </div>
                  <p
                    style={{
                      fontSize: "0.68rem",
                      color: done ? "#2E1D15" : "#C9B4AC",
                      fontWeight: done ? 600 : 400,
                      marginTop: "0.4rem",
                      textAlign: "center",
                      lineHeight: 1.3,
                    }}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomRequestsTab({
  loading,
  requests,
  onAcceptCounterOffer,
  onPromote,
}: {
  loading: boolean;
  requests: CustomRequest[];
  onAcceptCounterOffer: (req: CustomRequest) => void;
  onPromote: (req: CustomRequest) => void;
}) {
  if (loading) {
    return (
      <p style={{ color: "#7A6058", fontSize: "0.9rem" }}>Loading requestsâ€¦</p>
    );
  }
  if (requests.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {requests.map((req) => {
        const meta = customStatusMeta[req.status] ?? {
          label: req.status,
          tone: "#EDD4D4",
        };
        const needsDecision = req.status === "counter_offered";

        return (
          <div
            style={{
              backgroundColor: "#F7F3EC",
              borderRadius: 20,
              border: "1px solid #EDD4D4",
              padding: "1.25rem 1.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "1rem",
                marginBottom: "0.5rem",
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "Playfair Display, Georgia, serif",
                    fontWeight: 600,
                    color: "#2E1D15",
                    fontSize: "1rem",
                    marginBottom: 2,
                  }}
                >
                  {req.item_name}
                </p>
                <p style={{ color: "#7A6058", fontSize: "0.78rem" }}>
                  Submitted {new Date(req.created_at).toLocaleDateString("en-IN")}{" "}
                  {req.occasion ? `Â· Â· ${req.occasion}` : ""}
                </p>
              </div>
              <span
                style={{
                  backgroundColor: meta.tone,
                  color: req.status === "completed" ? "#EDD4D4" : "#2E1D15",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  padding: "0.25rem 0.6rem",
                  borderRadius: 50,
                  whiteSpace: "nowrap",
                }}
              >
                {meta.label}
              </span>
            </div>

            {req.description && (
              <p style={{ color: "#5A4238", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                {req.description}
              </p>
            )}
            {req.colors && (
              <p style={{ color: "#7A6058", fontSize: "0.8rem", marginTop: "0.4rem" }}>
                ðŸŽ¨ Colors: {req.colors}
              </p>
            )}
            {req.budget && (
              <p style={{ color: "#7A6058", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                ðŸ’° Your budget: â‚¹{req.budget}
              </p>
            )}

            {(req.status === "accepted" ||
              req.status === "counter_offered" ||
              req.status === "student_accepted" ||
              req.admin_price) && (
                <div
                  style={{
                    marginTop: "0.85rem",
                    padding: "0.75rem 1rem",
                    backgroundColor: "#FFFDF8",
                    borderRadius: 12,
                    border: "1px solid #EDD4D4",
                  }}
                >
                  {req.admin_price ? (
                    <p
                      style={{
                        fontWeight: 700,
                        color: "#C97B63",
                        fontSize: "1.05rem",
                      }}
                    >
                      Maker's price: â‚¹{req.admin_price}
                    </p>
                  ) : null}
                  {req.admin_notes ? (
                    <p style={{ color: "#7A6058", fontSize: "0.82rem", marginTop: 4 }}>
                      {req.admin_notes}
                    </p>
                  ) : null}
                </div>
              )}

            {needsDecision && (
              <div style={{ display: "flex", gap: 8, marginTop: "1rem" }}>
                <button
                  onClick={() => onAcceptCounterOffer(req)}
                  style={{
                    flex: 1,
                    padding: "0.6rem",
                    borderRadius: 50,
                    backgroundColor: "#A8B8A0",
                    color: "#FFFDF8",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  Accept & continue
                </button>
              </div>
            )}

            {(req.status === "student_accepted" || req.status === "accepted") &&
              !req.admin_price && (
                <p style={{ color: "#A8B8A0", fontSize: "0.78rem", marginTop: "0.6rem" }}>
                  Awaiting maker's price to continue.
                </p>
              )}

            {req.status === "student_accepted" && req.admin_price && (
              <button
                onClick={() => onPromote(req)}
                style={{
                  marginTop: "0.75rem",
                  width: "100%",
                  padding: "0.7rem",
                  borderRadius: 50,
                  backgroundColor: "#C97B63",
                  color: "#FFFDF8",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.88rem",
                  boxShadow: "0 4px 14px rgba(201,123,99,0.25)",
                }}
              >
                Pay â‚¹{req.admin_price} via Razorpay â†’
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}