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

export type OrderEmailTemplate = { subject: string; body: string };

export const defaultOrderEmailTemplate: OrderEmailTemplate = {
  subject: "Yay! Your Campus Crochet order is confirmed! 🧶",
  body: `Hii {user_name}!

Your order for **{item_name}** has officially been placed and received! 💌

I'm Asmita, the person behind Campus Crochet and the hands that will be making your little crochet creation!

Every item is handmade by me, especially for you, with lots of time, care and love.

You can expect your order to reach you within 1–2 weeks. Once your item is ready and shipped, I'll personally send you another email with an update!

A little note from me: I'm currently pursuing my B.Tech while running this little business, so I'm balancing academics with making your orders. Your patience and understanding genuinely mean a lot to me.

Thank you so much for supporting my small business and choosing something handmade. I can't wait for you to receive your order!

If you have any questions along the way, feel free to reach out at [support@campus-crochet.tech](mailto:support@campus-crochet.tech).

With love and a little bit of yarn,
**Asmita**
Founder & Maker, Campus Crochet 🧶

[campus-crochet.tech](https://campus-crochet.tech)`,
};

export const manualShippingEmail = {
  subject: "Your Campus Crochet order is on its way! 🧶📦",
  body: `Hii {user_name}!

Your {item_name} is finally ready, and I've just shipped it to your address!

I'm so excited for you to receive something that I've personally made from scratch, especially for you.

Here are your shipping details:

**Courier:** {courier_name}
**Tracking ID:** {tracking_id}

Thank you so much for patiently waiting while I worked on your order. I truly hope it brings a little smile to your face when you unbox it!

Do let me know once you've received it. I'd love to hear what you think! If you have a moment, please reply with a short review of your piece.

If you have any queries regarding your order, feel free to reach out at [support@campus-crochet.tech](mailto:support@campus-crochet.tech).

Thank you again for supporting my little crochet business. It genuinely means a lot to me! 💗

With love and a little bit of yarn,
**Asmita**
Founder & Maker, Campus Crochet
[campus-crochet.tech](https://campus-crochet.tech)`,
};

export const manualShippingEmailText = manualShippingEmail.body
  .replace(/\*\*/g, "")
  .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, "$1");

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

export function validateOrderEmailTemplate(input: unknown): OrderEmailTemplate {
  if (!input || typeof input !== "object") throw Error("Enter an email subject and message.");
  const value = input as Record<string, unknown>;
  if (typeof value.subject !== "string" || !value.subject.trim() || value.subject.length > 160 || /[\r\n]/.test(value.subject))
    throw Error("Enter a single-line email subject under 160 characters.");
  if (typeof value.body !== "string" || !value.body.trim() || value.body.length > 10000)
    throw Error("Enter an email message under 10,000 characters.");
  for (const token of ["user_name", "item_name"])
    if (!value.body.includes(`{${token}}`)) throw Error(`Keep {${token}} in the email message.`);
  const unknown = `${value.subject}\n${value.body}`.match(/\{[a-z_]+\}/g)?.find((token) =>
    token !== "{user_name}" && token !== "{item_name}");
  if (unknown) throw Error(`Unsupported placeholder ${unknown}.`);
  return { subject: value.subject.trim(), body: value.body.trim() };
}

function itemNames(order: OrderEmailOrder) {
  const names = order.items.map(({ name, quantity }) => `${name}${quantity > 1 ? ` × ${quantity}` : ""}`);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0] || "your handmade piece";
}

function fillPlaceholders(value: string, order: OrderEmailOrder, html: boolean) {
  return value.replace(/\{(user_name|item_name)\}/g, (_token, key: string) => {
    const replacement = key === "user_name" ? order.name : itemNames(order);
    return html ? key === "item_name" ? `<strong>${escapeHtml(replacement)}</strong>` : escapeHtml(replacement) : replacement;
  });
}

function renderBodyHtml(body: string, order: OrderEmailOrder) {
  const safe = escapeHtml(body.replace(/\*\*\{item_name\}\*\*/g, "{item_name}"))
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,
      (_whole, label: string, href: string) => `<a href="${href}" rel="noopener noreferrer">${label}</a>`)
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  return safe.split(/\n\s*\n/).map((paragraph) =>
    `<p style="margin:0 0 16px">${fillPlaceholders(paragraph, order, true).replace(/\n/g, "<br>")}</p>`).join("");
}

function renderBodyText(body: string, order: OrderEmailOrder) {
  return fillPlaceholders(body.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, "$1"), order, false);
}

export function composeOrderEmail(order: OrderEmailOrder, template: OrderEmailTemplate = defaultOrderEmailTemplate) {
  const subject = fillPlaceholders(template.subject, order, false);
  const text = renderBodyText(template.body, order);
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.65;max-width:620px;margin:auto;color:#352b31;padding:20px">${renderBodyHtml(template.body, order)}</div>`;
  return { eventKey: `campus-crochet/confirmation/${order.id}`, to: [order.registeredEmail], subject, html, text };
}
