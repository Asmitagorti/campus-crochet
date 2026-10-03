import { supabase } from "./supabase";

// ── Canonical DB types (match Supabase schema) ──────────────────────────────
export type DbProduct = {
  product_id: string;
  name: string;
  short_description: string | null;
  full_description: string | null;
  price: number;
  stock_quantity: number;
  processing_time_days: number | null;
  category: string | null;
  is_available: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  product_images: { image_id: string; image_url: string; display_order: number | null }[];
  product_colors: { color_id: string; color_name: string }[];
};

export type DbUser = {
  user_id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  year: string | null;
  branch: string | null;
  phone_number: string | null;
  created_at: string | null;
};

export type DbOrder = {
  order_id: string;
  user_id: string | null;
  order_status: string | null;
  payment_status: string | null;
  total_price: number | null;
  payment_method: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  receipt_number: string | null;
  ordered_at: string | null;
  completed_at: string | null;
};

export type DbOrderItem = {
  order_id: string;
  product_id: string | null;
  quantity: number | null;
  selected_color: string | null;
};

// Flattened order row for admin tables (joins done server-side)
export type AdminOrder = {
  order_id: string;
  product_name: string;
  product_id: string | null;
  customer_name: string;
  customer_email: string;
  college: string; // display-only; schema has branch/year — shows branch
  status: string;
  payment_status: string;
  payment_method: string | null;
  ordered_at: string | null;
  amount: number;
  color: string;
  quantity: number;
};

export const ORDER_STATUSES = [
  "payment_received",
  "confirmed",
  "yarn_selected",
  "crocheting",
  "quality_check",
  "ready",
  "completed",
  "cancelled",
] as const;

export function formatOrderDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// ── Fetch helpers (authenticated; server enforces ownership via RLS) ─────────
// NOTE: /api/orders now returns OrderDetail[] (one object per order, with
// items). Use toAdminRows() below for the flattened admin table shape.
export async function fetchProducts(): Promise<DbProduct[]> {
  const res = await fetch("/api/products", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load products. Please try again.");
  return res.json();
}

export async function authHeader(): Promise<Record<string, string>> {
  const { supabase } = await import("./supabase");
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export async function fetchAdminOrders(): Promise<AdminOrder[]> {
  const { toAdminRows, apiJson } = await import("./api");
  const details = await apiJson<import("./api").OrderDetail[]>("/api/orders");
  return toAdminRows(details);
}

export async function fetchUsers(): Promise<DbUser[]> {
  const headers = await authHeader();
  const res = await fetch("/api/users", { cache: "no-store", headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? "Could not load users. Please try again.");
  }
  return res.json();
}

export async function updateOrderStatus(order_id: string, order_status: string) {
  const headers = await authHeader();
  const res = await fetch(`/api/orders/${order_id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ order_status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Could not update the order. Please try again.");
  }
  return res.json();
}

export type ProductInput = {
  name: string;
  price: number;
  category: string;
  short_description?: string;
  full_description?: string;
  stock_quantity?: number;
  processing_time_days?: number;
  is_available?: boolean;
  image_urls?: string[];
  colors?: string[];
};

export async function createProduct(input: ProductInput) {
  const headers = await authHeader();
  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Could not add the product. Please try again.");
  }
  return res.json();
}

export async function updateProduct(product_id: string, input: Partial<ProductInput>) {
  const headers = await authHeader();
  const res = await fetch(`/api/products/${product_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Could not save the product. Please try again.");
  }
  return res.json();
}

export async function deleteProduct(product_id: string) {
  const headers = await authHeader();
  const res = await fetch(`/api/products/${product_id}`, { method: "DELETE", headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Could not remove the product. Please try again.");
  }
  return res.json();
}

// Direct supabase passthrough (read-only, anon-safe)
export { supabase };
