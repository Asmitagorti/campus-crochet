import "server-only";
import { randomUUID, createHash } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { firestore } from "./firebase-admin";
import { products, Product } from "./catalog";
export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};
export type OrderRow = {
  id: string;
  token: string;
  userId: string;
  idempotency_key: string;
  fingerprint: string;
  customer: string;
  items: string;
  amount: number;
  status: string;
  provider_id: string | null;
  payment_id: string | null;
  created_at: string;
  mode?: "test" | "live";
};
function asOrder(
  data: FirebaseFirestore.DocumentData | undefined,
): OrderRow | undefined {
  return data
    ? ({
        ...data,
        customer: JSON.stringify(data.customer),
        items: JSON.stringify(data.items),
      } as OrderRow)
    : undefined;
}
export function newReference(prefix = "CC") {
  return `${prefix}-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
}
export async function inventory() {
  const data = await firestore()
    .collection("products")
    .where("active", "==", true)
    .get();
  return Object.fromEntries(data.docs.map((d) => [d.id, d.data().stock || 0]));
}
export async function loadProducts(
  includeArchived = false,
): Promise<Product[]> {
  const collection = firestore().collection("products");
  const data = includeArchived
    ? await collection.get()
    : await collection.where("active", "==", true).get();
  return data.docs
    .filter((d) => !d.data().testOnly)
    .map((d) => {
      const p = d.data();
      return {
        id: d.id,
        name: p.name,
        category: p.category,
        note: p.note,
        price: p.price,
        description: p.description,
        details: (p.details || []).map((d: { key: string; value: string }) => [
          d.key,
          d.value,
        ]),
        colors: p.colors,
        stock: p.stock,
        madeToOrder: false,
        gallery: p.gallery,
        active: p.active,
        revision: p.revision || 0,
      } as Product;
    })
    .sort(
      (a, b) =>
        products.findIndex((p) => p.id === a.id) -
        products.findIndex((p) => p.id === b.id),
    );
}
export async function orderById(id: string) {
  return asOrder((await firestore().doc(`orders/${id}`).get()).data());
}
export async function orderByKey(key: string) {
  const doc = await firestore().doc(`order_keys/${key}`).get();
  return doc.exists ? orderById(doc.data()!.orderId) : undefined;
}
export async function orderByProvider(id: string) {
  const data = await firestore()
    .collection("orders")
    .where("provider_id", "==", id)
    .limit(1)
    .get();
  return asOrder(data.docs[0]?.data());
}
export async function attachProvider(id: string, providerId: string) {
  await firestore()
    .doc(`orders/${id}`)
    .update({ provider_id: providerId, status: "pending" });
}
export async function releaseOrder(id: string) {
  const f = firestore();
  await f.runTransaction(async (tx) => {
    const ref = f.doc(`orders/${id}`),
      snap = await tx.get(ref),
      row = snap.data();
    if (!row || !["creating", "pending"].includes(row.status)) return;
    const items = row.items as OrderItem[],
      refs = items.map((i) => f.doc(`products/${i.id}`)),
      stock = await tx.getAll(...refs);
    stock.forEach((doc, index) =>
      tx.update(doc.ref, {
        stock: (doc.data()?.stock || 0) + items[index].quantity,
        revision: (doc.data()?.revision || 0) + 1,
      }),
    );
    tx.update(ref, {
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    });
    tx.delete(f.doc("payment_reservations/" + id));
  });
}
export async function markPaid(row: OrderRow, paymentId: string) {
  const f = firestore();
  await f.runTransaction(async (tx) => {
    const ref = f.doc(`orders/${row.id}`),
      snap = await tx.get(ref),
      current = snap.data();
    if (!current) throw Error("Order not found.");
    const paymentRef = f.doc(`payments/${paymentId}`),
      payment = await tx.get(paymentRef);
    if (current.status === "paid") {
      if (current.payment_id !== paymentId) throw Error("Payment mismatch");
      return;
    }
    if (payment.exists && payment.data()?.orderId !== row.id)
      throw Error("Payment already belongs to another order.");
    if (!["pending", "creating"].includes(current.status))
      throw Error(
        "This order needs a studio review. Please contact us with your payment reference.",
      );
    tx.update(ref, {
      status: "paid",
      payment_id: paymentId,
      paidAt: new Date().toISOString(),
    });
    tx.set(paymentRef, {
      orderId: row.id,
      amount: row.amount,
      createdAt: new Date().toISOString(),
    });
    tx.delete(f.doc("payment_reservations/" + row.id));
  });
}
export async function createReservedOrder(input: {
  id: string;
  token: string;
  userId: string;
  key: string;
  fingerprint: string;
  customer: unknown;
  items: OrderItem[];
  amount: number;
}) {
  const f = firestore();
  await f.runTransaction(async (tx) => {
    const keyRef = f.doc(`order_keys/${input.key}`),
      key = await tx.get(keyRef);
    if (key.exists)
      throw Error("This checkout is already being processed. Please retry.");
    const refs = input.items.map((i) => f.doc(`products/${i.id}`)),
      snapshots = await tx.getAll(...refs);
    for (let i = 0; i < input.items.length; i++) {
      const p = snapshots[i].data(),
        item = input.items[i];
      if (!p?.active || p.price !== item.price)
        throw Error("A product or price has changed. Please refresh your bag.");
      if (p.stock < item.quantity)
        throw Error(`${item.name} no longer has that quantity in stock.`);
    }
    for (let i = 0; i < input.items.length; i++)
      tx.update(refs[i], {
        stock: snapshots[i].data()!.stock - input.items[i].quantity,
        revision: (snapshots[i].data()!.revision || 0) + 1,
      });
    tx.create(f.doc(`orders/${input.id}`), {
      id: input.id,
      token: input.token,
      userId: input.userId,
      mode: process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_")
        ? "test"
        : "live",
      idempotency_key: input.key,
      fingerprint: input.fingerprint,
      customer: input.customer,
      items: input.items,
      amount: input.amount,
      status: "creating",
      provider_id: null,
      payment_id: null,
      created_at: new Date().toISOString(),
    });
    tx.create(keyRef, { orderId: input.id });
    tx.create(f.doc("payment_reservations/" + input.id), {
      orderId: input.id,
      expiresAt: Timestamp.fromMillis(Date.now() + 30 * 60 * 1000),
    });
  });
}
export async function allowRequest(key: string, max = 15) {
  const f = firestore(),
    id = createHash("sha256").update(key).digest("hex");
  return f.runTransaction(async (tx) => {
    const ref = f.doc(`request_limits/${id}`),
      snap = await tx.get(ref),
      data = snap.data(),
      now = Date.now(),
      expired = !data || data.until < now;
    if (!expired && data.hits >= max) return false;
    tx.set(ref, {
      hits: expired ? 1 : data.hits + 1,
      until: expired ? now + 900000 : data.until,
      expiresAt: Timestamp.fromMillis(now + 900000),
    });
    return true;
  });
}
export async function saveMessage(data: Record<string, unknown>) {
  const id = newReference("HELLO");
  await firestore()
    .doc(`messages/${id}`)
    .create({
      ...data,
      id,
      created_at: new Date().toISOString(),
      status: "new",
    });
  return id;
}
