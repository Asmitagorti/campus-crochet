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

export function composeOrderEmail(order: OrderEmailOrder) {
  const subject = `Order confirmed · ${order.id} · Campus Crochet`;
  const intro = "Your payment is confirmed. Your piece will be made to order and dispatched in 5–7 working days. I'll email you personally from support@campus-crochet.tech when it is ready.";
  const lines = order.items.map((item) => `${item.name} × ${item.quantity} · ${rupees(item.price)} each · ${rupees(item.price * item.quantity)}`);
  const showBreakdown = order.subtotalPaise !== undefined || order.deliveryPaise !== undefined;
  const subtotal = rupees((order.subtotalPaise ?? order.totalPaise - (order.deliveryPaise ?? 0)) / 100);
  const delivery = order.deliveryPaise ? rupees(order.deliveryPaise / 100) : "Free";
  const deliveryLine = showBreakdown ? `Subtotal: ${subtotal}\nDelivery charge: ${delivery}\n` : "";
  const deliveryHtml = showBreakdown ? `<strong>Subtotal:</strong> ${subtotal}<br><strong>Delivery charge:</strong> ${delivery}<br>` : "";
  const text = `Hello ${order.name},\n\n${intro}\n\nOrder ID: ${order.id}\nStatus: Confirmed\n${lines.join("\n")}\n${deliveryLine}Total paid: ${rupees(order.totalPaise / 100)}\nDelivery: ${order.address}\n\nCheck your account for order progress.\n\nQuestions? Write to support@campus-crochet.tech.`;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:620px;margin:auto;color:#352b31"><h1 style="color:#87502c">Your order is confirmed</h1><p>Hello ${escape(order.name)},</p><p>${escape(intro)}</p><p><strong>Order ID:</strong> ${escape(order.id)}<br><strong>Status:</strong> Confirmed</p><ul>${order.items.map((item) => `<li>${escape(item.name)} × ${item.quantity} · ${rupees(item.price)} each · ${rupees(item.price * item.quantity)}</li>`).join("")}</ul><p>${deliveryHtml}<strong>Total paid:</strong> ${rupees(order.totalPaise / 100)}<br><strong>Delivery:</strong> ${escape(order.address)}</p><p>Check your account for order progress.</p><p>Questions? <a href="mailto:support@campus-crochet.tech">Email support</a>.</p></div>`;
  return { eventKey: `campus-crochet/confirmation/${order.id}`, to: [order.registeredEmail], subject, html, text };
}
