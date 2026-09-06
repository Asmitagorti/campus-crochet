"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Product, Order } from "@/types";

type DbProductImage = { image_id: string; image_url: string; display_order: number | null };
type DbProductColor = { color_id: string; color_name: string };
type DbProduct = {
  product_id: string;
  name: string;
  short_description: string | null;
  full_description: string | null;
  price: number | string;
  stock_quantity: number | null;
  processing_time_days: number | null;
  category: string;
  is_available: boolean | null;
  updated_at: string | null;
  product_images?: DbProductImage[] | null;
  product_colors?: DbProductColor[] | null;
};

function toClientProduct(row: DbProduct & { id?: string; colors?: string[]; image?: string; description?: string }): Product {
  const id = row.product_id ?? row.id ?? "";
  const primaryImage =
    (row.product_images ?? [])
      .slice()
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))[0]?.image_url ??
    row.image ??
    "";

  const colorNames =
    row.colors ??
    (row.product_colors ?? []).map((c) => (typeof c === "string" ? c : c.color_name));
  const days = row.processing_time_days ?? null;
  const processingTime = days ? `${days}-${days + 2} working days` : undefined;

  return {
    id,
    name: row.name,
    price: Number(row.price),
    category: row.category,
    colors: colorNames,
    image: primaryImage,
    description: row.full_description ?? row.short_description ?? row.description ?? "",
    short_description: row.short_description ?? undefined,
    stock: row.stock_quantity ?? undefined,
    is_available: row.is_available ?? false,
    processing_time_days: days ?? undefined,
    processing_time: processingTime,
    updated_at: row.updated_at ?? undefined,
  };
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = (await res.json()) as DbProduct[];
        if (!mounted) return;
        setProducts(rows.map(toClientProduct));
      } catch (e: unknown) {
        console.error("useProducts error:", e);
        if (mounted) {
          setError(e instanceof Error ? e.message : "Failed to load products");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { products, loading, error };
}

type DbOrderItem = {
  order_item_id: string;
  order_id: string;
  product_id: string;
  selected_color: string | null;
  quantity: number;
  price_at_purchase: number | string | null;
};

type DbOrderProduct = {
  product_id: string;
  name: string;
  price: number | string;
  category: string;
  is_available: boolean | null;
  product_images?: DbProductImage[] | null;
  product_colors?: DbProductColor[] | null;
};

type DbOrderItemWithProduct = DbOrderItem & {
  product?: DbOrderProduct | DbOrderProduct[] | null;
};

type DbOrder = {
  id?: string;
  order_id?: string;
  user_id: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  payment_status: Order["payment_status"] | string;
  order_status: Order["order_status"] | string;
  payment_method: string | null;
  total_price: number | string;
  ordered_at?: string | null;
  order_items?: DbOrderItemWithProduct[] | null;
};

function firstProduct(item: DbOrderItemWithProduct["product"]): DbOrderProduct | null {
  if (!item) return null;
  return Array.isArray(item) ? (item[0] ?? null) : item;
}

function orderItemToClient(item: DbOrderItemWithProduct): Order["order_items"] extends (infer T)[] | undefined ? T : never {
  const prod = firstProduct(item.product);
  const product: Product | undefined = prod
    ? {
        id: prod.product_id,
        name: prod.name,
        price: Number(prod.price),
        category: prod.category,
        colors: (prod.product_colors ?? []).map((c) => c.color_name),
        image: (prod.product_images ?? [])
          .slice()
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))[0]?.image_url ?? "",
        description: "",
        is_available: prod.is_available ?? false,
      }
    : undefined;
  return {
    id: item.order_item_id,
    order_id: item.order_id,
    product_id: item.product_id,
    selected_color: item.selected_color ?? "",
    quantity: item.quantity,
    price_at_purchase: Number(item.price_at_purchase ?? 0),
    products: product,
  } as unknown as Order["order_items"] extends (infer T)[] | undefined ? T : never;
}

function toClientOrder(row: DbOrder): Order {
  const orderId = row.order_id || row.id || "";
  return {
    id: orderId,
    order_id: orderId,
    user_id: row.user_id,
    razorpay_order_id: row.razorpay_order_id ?? undefined,
    razorpay_payment_id: row.razorpay_payment_id ?? undefined,
    payment_status: row.payment_status as Order["payment_status"],
    order_status: row.order_status as Order["order_status"],
    payment_method: row.payment_method ?? undefined,
    total_price: Number(row.total_price),
    ordered_at: row.ordered_at ?? undefined,
    order_items: (row.order_items ?? []).map((it) => orderItemToClient(it)),
  };
}

export function useOrdersForUser(userId: string | null | undefined) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!userId) {
        if (mounted) {
          setOrders([]);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/orders?user_id=${userId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = ((await res.json()) ?? []) as DbOrder[];
        if (mounted) setOrders(rows.map(toClientOrder));
      } catch (e) {
        console.error("useOrdersForUser error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [userId]);

  return { orders, loading, refetch: () => {} };
}

export function useOrderRealtime(userId: string | null | undefined) {
  const [latestUpdate, setLatestUpdate] = useState<{
    id: string;
    status: string;
    updated_at: string;
  } | null>(null);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`orders-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          setLatestUpdate({
            id: String(row.order_id ?? ""),
            status: String(row.order_status ?? ""),
            updated_at: String(row.updated_at ?? new Date().toISOString()),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return latestUpdate;
}