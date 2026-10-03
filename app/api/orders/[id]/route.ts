import { requireCaller } from "@/lib/auth";

const ALLOWED_STATUSES = [
  "payment_received",
  "confirmed",
  "yarn_selected",
  "crocheting",
  "quality_check",
  "ready",
  "completed",
  "cancelled",
];

async function loadDetail(db: any, order_id: string) {
  const { data: o, error } = await db
    .from("orders")
    .select(
      "order_id, user_id, order_status, payment_status, total_price, payment_method, ordered_at, completed_at, receipt_number"
    )
    .eq("order_id", order_id)
    .maybeSingle();
  if (error) throw new Error("db");
  if (!o) return null;

  const [{ data: items }, { data: users }, { data: products }] = await Promise.all([
    db.from("order_items").select("order_id, product_id, quantity, selected_color").eq("order_id", order_id),
    db.from("users").select("user_id, email, full_name, phone_number, branch, year").eq("user_id", o.user_id),
    db.from("products").select("product_id, name, price, product_images ( image_url, display_order )"),
  ]);

  const u: any = (users ?? [])[0] ?? {};
  const productById = new Map((products ?? []).map((p: any) => [p.product_id, p]));
  const firstImage = (p: any): string =>
    (p?.product_images ?? [])
      .slice()
      .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))[0]?.image_url ?? "";

  return {
    order_id: o.order_id,
    user_id: o.user_id,
    customer_name: u?.full_name ?? "Customer",
    customer_email: u?.email ?? "",
    customer_phone: u?.phone_number ?? "",
    customer_branch: u?.branch ?? "",
    customer_year: u?.year ?? "",
    order_status: o.order_status ?? "payment_received",
    payment_status: o.payment_status ?? "unpaid",
    payment_method: o.payment_method ?? null,
    total_price: o.total_price ?? 0,
    ordered_at: o.ordered_at,
    completed_at: o.completed_at,
    receipt_number: o.receipt_number ?? null,
    items: (items ?? []).map((it: any) => {
      const p: any = productById.get(it.product_id);
      const qty = it.quantity ?? 1;
      const unit = p?.price ?? 0;
      return {
        product_id: it.product_id,
        product_name: p?.name ?? "Product",
        image_url: firstImage(p),
        quantity: qty,
        selected_color: it.selected_color ?? "",
        unit_price: unit,
        line_total: unit * qty,
      };
    }),
  };
}

/** GET /api/orders/:id — owner or admin only. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { caller, db } = await requireCaller(_req);
    const { id } = await params;
    const detail = await loadDetail(db, id);
    if (!detail) return Response.json({ error: "Order not found." }, { status: 404 });
    if (!caller.isAdmin && detail.user_id !== caller.id) {
      return Response.json({ error: "You can only view your own orders." }, { status: 403 });
    }
    if (!caller.isAdmin) {
      detail.customer_phone = "";
    }
    return Response.json(detail);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("ORDER GET ERROR:", res);
    return Response.json({ error: "Could not load the order. Please try again." }, { status: 500 });
  }
}

/**
 * PATCH /api/orders/:id — admin only, order_status ONLY.
 * payment_status is owned by the payment system and can never be changed here,
 * so an unpaid order can never be falsely marked paid by an admin.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { caller, db } = await requireCaller(req);
    if (!caller.isAdmin) {
      return Response.json({ error: "Admin access only." }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    if ("payment_status" in body || "razorpay_payment_id" in body || "total_price" in body) {
      return Response.json(
        { error: "Payment details cannot be changed here. They are set by verified payments only." },
        { status: 403 }
      );
    }

    const { order_status } = body;
    if (!order_status || !ALLOWED_STATUSES.includes(order_status)) {
      return Response.json({ error: "Please choose a valid order status." }, { status: 400 });
    }

    const patch: Record<string, unknown> = { order_status };
    if (order_status === "completed") patch.completed_at = new Date().toISOString();

    const { data, error } = await db.from("orders").update(patch).eq("order_id", id).select("order_id, order_status");
    if (error) {
      console.error("SUPABASE ORDER UPDATE ERROR:", error);
      return Response.json({ error: "Could not update the order. Please try again." }, { status: 500 });
    }
    if (!data || data.length === 0) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }
    return Response.json(data[0]);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("ORDER PATCH ERROR:", res);
    return Response.json({ error: "Could not update the order. Please try again." }, { status: 500 });
  }
}
