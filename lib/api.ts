import { supabase } from "./supabase";

/**
 * Authenticated fetch wrapper for our own API routes.
 * Attaches the caller's Supabase JWT so server routes can authorize via RLS.
 * Server routes return user-friendly messages already — just surface them.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  if (init.body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(path, { ...init, headers });
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof body?.error === "string" && body.error.length > 0
        ? body.error
        : "Something went wrong. Please try again."
    );
  }
  return body as T;
}

// ── Order tracking timeline (single source of truth, shared UI) ─────────────
export const TRACKING_STEPS = [
  { key: "payment_received", label: "Payment received" },
  { key: "confirmed", label: "Order confirmed" },
  { key: "yarn_selected", label: "Materials selected" },
  { key: "crocheting", label: "Crocheting" },
  { key: "quality_check", label: "Quality check" },
  { key: "ready", label: "Ready for pickup" },
  { key: "completed", label: "Completed" },
] as const;

export type TrackingKey = (typeof TRACKING_STEPS)[number]["key"];

export function stepIndex(status: string | null | undefined): number {
  const i = TRACKING_STEPS.findIndex((s) => s.key === status);
  return i < 0 ? 0 : i;
}

export function isTerminalStatus(status: string | null | undefined): boolean {
  return status === "completed" || status === "cancelled";
}

// Full order detail (customer order page + admin order drawer)
export type OrderItemDetail = {
  product_id: string | null;
  product_name: string;
  image_url: string;
  quantity: number;
  selected_color: string;
  unit_price: number;
  line_total: number;
};

export type OrderDetail = {
  order_id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_branch: string;
  customer_year: string;
  order_status: string;
  payment_status: string;
  payment_method: string | null;
  total_price: number;
  ordered_at: string | null;
  completed_at: string | null;
  receipt_number: string | null;
  items: OrderItemDetail[];
};

// ── Custom requests ─────────────────────────────────────────────────────────
export type CustomRequest = {
  request_id: string;
  user_id: string;
  description: string;
  preferred_color: string | null;
  size: string | null;
  quantity: number;
  budget: number | null;
  extra_requirements: string | null;
  reference_image_url: string | null;
  status: "pending" | "accepted" | "rejected" | "completed";
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
};

export const fetchMyOrders = () => apiJson<OrderDetail[]>("/api/orders?mine=1");
export const fetchAllOrders = () => apiJson<OrderDetail[]>("/api/orders");
export const fetchOrder = (id: string) => apiJson<OrderDetail>(`/api/orders/${id}`);

/** Flatten OrderDetail[] into admin-table rows (one row per line item). */
export function toAdminRows(details: OrderDetail[]) {
  const rows: {
    order_id: string;
    product_name: string;
    product_id: string | null;
    customer_name: string;
    customer_email: string;
    college: string;
    status: string;
    payment_status: string;
    payment_method: string | null;
    ordered_at: string | null;
    amount: number;
    color: string;
    quantity: number;
  }[] = [];
  for (const o of details) {
    if (o.items.length === 0) {
      rows.push({
        order_id: o.order_id,
        product_name: "—",
        product_id: null,
        customer_name: o.customer_name,
        customer_email: o.customer_email,
        college: o.customer_branch || "—",
        status: o.order_status,
        payment_status: o.payment_status,
        payment_method: o.payment_method,
        ordered_at: o.ordered_at,
        amount: o.total_price ?? 0,
        color: "—",
        quantity: 0,
      });
    } else {
      for (const it of o.items) {
        rows.push({
          order_id: o.order_id,
          product_name: it.product_name,
          product_id: it.product_id,
          customer_name: o.customer_name,
          customer_email: o.customer_email,
          college: o.customer_branch || "—",
          status: o.order_status,
          payment_status: o.payment_status,
          payment_method: o.payment_method,
          ordered_at: o.ordered_at,
          amount: it.line_total,
          color: it.selected_color || "—",
          quantity: it.quantity,
        });
      }
    }
  }
  return rows;
}
export const adminUpdateOrderStatus = (id: string, order_status: string) =>
  apiJson(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify({ order_status }) });

export const fetchMyRequests = () => apiJson<CustomRequest[]>("/api/custom-requests?mine=1");
export const fetchAllRequests = () => apiJson<CustomRequest[]>("/api/custom-requests");
export const createRequest = (input: Record<string, unknown>) =>
  apiJson<CustomRequest>("/api/custom-requests", { method: "POST", body: JSON.stringify(input) });
export const adminUpdateRequest = (id: string, input: { status?: string; admin_note?: string }) =>
  apiJson(`/api/custom-requests/${id}`, { method: "PATCH", body: JSON.stringify(input) });

export type Profile = {
  user_id: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  branch: string | null;
  year: string | null;
  role: string | null;
  created_at: string | null;
};

export const fetchProfile = () => apiJson<Profile>("/api/profile");
export const updateProfile = (input: { full_name?: string; phone_number?: string; branch?: string; year?: string }) =>
  apiJson<Profile>("/api/profile", { method: "PATCH", body: JSON.stringify(input) });

// ── Checkout ────────────────────────────────────────────────────────────────
export type CartLine = { productId: string; color: string; quantity: number };

export type CheckoutQuote = {
  razorpay_order_id: string;
  amount: number;
  currency: string;
  receipt: string;
  key_id: string | null;
  razorpay_configured: boolean;
  lines: { product_id: string; name: string; quantity: number; unit_price: number; line_total: number }[];
};

export const createCheckoutOrder = (cart: CartLine[]) =>
  apiJson<CheckoutQuote>("/api/checkout/create-order", { method: "POST", body: JSON.stringify({ cart }) });

export const verifyPayment = (input: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  receipt: string;
}) => apiJson<OrderDetail>("/api/checkout/verify", { method: "POST", body: JSON.stringify(input) });
