export type OrderEmailKind = "confirmation" | "completion";
export type OrderEmailOrder = {
  id: string;
  registeredEmail: string;
  name: string;
  address: string;
  items: { name: string; quantity: number; price: number }[];
  totalPaise: number;
  subtotalPaise?: number;
  deliveryPaise?: number;
};
const rupees = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
const escape = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

export function composeOrderEmail(kind: OrderEmailKind, order: OrderEmailOrder) {
  const completed = kind === "completion";
  const subject = `${completed ? "Order completed" : "Order confirmed"} · ${order.id} · Campus Crochet`;
  const intro = completed ? "Your order is completed. Thank you for choosing handmade." : "Your payment is confirmed and your order is in our hands.";
  const lines = order.items.map((item) => `${item.name} × ${item.quantity} · ${rupees(item.price)} each · ${rupees(item.price * item.quantity)}`);
  const deliveryLine = order.deliveryPaise ? `Subtotal: ${rupees((order.subtotalPaise ?? order.totalPaise - order.deliveryPaise) / 100)}\nDelivery charge: ${rupees(order.deliveryPaise / 100)}\n` : "";
  const deliveryHtml = order.deliveryPaise ? `<strong>Subtotal:</strong> ${rupees((order.subtotalPaise ?? order.totalPaise - order.deliveryPaise) / 100)}<br><strong>Delivery charge:</strong> ${rupees(order.deliveryPaise / 100)}<br>` : "";
  const text = `Hello ${order.name},\n\n${intro}\n\nOrder ID: ${order.id}\nStatus: ${completed ? "Completed" : "Confirmed"}\n${lines.join("\n")}\n${deliveryLine}Total paid: ${rupees(order.totalPaise / 100)}\nDelivery: ${order.address}\n\nCheck your account for order progress. Keep this email accessible and enable notifications for important updates.\n\nQuestions? Write to support@campus-crochet.tech.`;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:620px;margin:auto;color:#352b31"><h1 style="color:#87502c">${completed ? "Your order is completed" : "Your order is confirmed"}</h1><p>Hello ${escape(order.name)},</p><p>${escape(intro)}</p><p><strong>Order ID:</strong> ${escape(order.id)}<br><strong>Status:</strong> ${completed ? "Completed" : "Confirmed"}</p><ul>${order.items.map((item) => `<li>${escape(item.name)} × ${item.quantity} · ${rupees(item.price)} each · ${rupees(item.price * item.quantity)}</li>`).join("")}</ul><p>${deliveryHtml}<strong>Total paid:</strong> ${rupees(order.totalPaise / 100)}<br><strong>Delivery:</strong> ${escape(order.address)}</p><p>Check your account for order progress. Keep this email accessible and enable notifications for important updates.</p><p>Questions? <a href="mailto:support@campus-crochet.tech">Email support</a>.</p></div>`;
  return { eventKey: `campus-crochet/${kind}/${order.id}`, to: [order.registeredEmail], subject, html, text };
}
