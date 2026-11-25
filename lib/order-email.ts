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
export type EmailKind = "confirmation" | "shipping" | "received";

export function parseEmailKind(value: unknown): EmailKind {
  if (value === "confirmation" || value === "shipping" || value === "received") return value;
  throw Error("Choose a valid email type.");
}

const trackingReminder = "You can track your order as I make and dispatch it. Check your profile regularly for updates at [campus-crochet.tech/account](https://campus-crochet.tech/account).";

export const defaultOrderEmailTemplate: OrderEmailTemplate = {
  subject: "Yay! Your Campus Crochet order is confirmed! 🧶",
  body: `Hii {user_name}!

Your order for **{item_name}** has officially been placed and received! 💌

I'm Asmita, the person behind Campus Crochet and the hands that will be making your little crochet creation!

Every item is handmade by me, especially for you, with lots of time, care and love.

You can expect your order to reach you within 1–2 weeks. Once your item is ready and shipped, I'll personally send you another email with an update!

A little note from me: I'm currently pursuing my B.Tech while running this little business, so I'm balancing academics with making your orders. Your patience and understanding genuinely mean a lot to me.

Thank you so much for supporting my small business and choosing something handmade. I can't wait for you to receive your order!

${trackingReminder}

If you have any questions along the way, feel free to reach out at [support@campus-crochet.tech](mailto:support@campus-crochet.tech).

With love and a little bit of yarn,
**Asmita**
Founder & Maker, Campus Crochet 🧶

[campus-crochet.tech](https://campus-crochet.tech)`,
};

export function withOrderTrackingReminder(template: OrderEmailTemplate): OrderEmailTemplate {
  if (template.body.includes("https://campus-crochet.tech/account")) return template;
  const signature = /\n\nWith love/i;
  const body = signature.test(template.body)
    ? template.body.replace(signature, `\n\n${trackingReminder}\n\nWith love`)
    : `${template.body.trimEnd()}\n\n${trackingReminder}`;
  return { ...template, body };
}

export const defaultShippingEmailTemplate: OrderEmailTemplate = {
  subject: "Your Campus Crochet order is on its way! 🧶📦",
  body: `Hii {user_name}!

Your **{item_name}** is finally ready, and I've just shipped it to your address!

I'm so excited for you to receive something that I've personally made from scratch, especially for you.

Here are your shipping details:

**Courier:** {courier_name}
**Tracking ID:** {tracking_id}

Thank you so much for patiently waiting while I worked on your order. I truly hope it brings a little smile to your face when you unbox it!

Do let me know once you've received it. I'd love to hear what you think!

If you have any queries regarding your order, feel free to reach out at [support@campus-crochet.tech](mailto:support@campus-crochet.tech).

Thank you again for supporting my little crochet business. It genuinely means a lot to me! 💗

With love and a little bit of yarn,
**Asmita**
Founder & Maker, Campus Crochet
[campus-crochet.tech](https://campus-crochet.tech)`,
};

export const manualShippingEmail = defaultShippingEmailTemplate;

export const defaultReceivedEmailTemplate: OrderEmailTemplate = {
  subject: "How is your Campus Crochet piece? 🧶💗",
  body: `Hii {user_name}!

I hope your **{item_name}** has reached you safely and brought a little smile to your day!

If you have a moment, I'd love to hear what you think. Just reply to this email with a short review of your handmade piece.

If you share a photo or story on Instagram, please tag Campus Crochet on Instagram so I can see your creation in its new home!

Thank you again for supporting my little crochet business. Making something for you meant a lot to me! 💗

With love and a little bit of yarn,
**Asmita**
Founder & Maker, Campus Crochet 🧶

[campus-crochet.tech](https://campus-crochet.tech)`,
};

export const defaultEmailTemplates: Record<EmailKind, OrderEmailTemplate> = {
  confirmation: defaultOrderEmailTemplate,
  shipping: defaultShippingEmailTemplate,
  received: defaultReceivedEmailTemplate,
};

export const manualShippingEmailText = manualShippingEmail.body
  .replace(/\*\*/g, "")
  .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, "$1");

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

export function validateEmailTemplate(kind: EmailKind, input: unknown): OrderEmailTemplate {
  if (!input || typeof input !== "object") throw Error("Enter an email subject and message.");
  const value = input as Record<string, unknown>;
  if (typeof value.subject !== "string" || !value.subject.trim() || value.subject.length > 160 || /[\r\n]/.test(value.subject))
    throw Error("Enter a single-line email subject under 160 characters.");
  if (typeof value.body !== "string" || !value.body.trim() || value.body.length > 10000)
    throw Error("Enter an email message under 10,000 characters.");
  for (const token of kind === "shipping" ? ["user_name", "item_name", "courier_name", "tracking_id"] : ["user_name", "item_name"])
    if (!value.body.includes(`{${token}}`)) throw Error(`Keep {${token}} in the email message.`);
  const unknown = `${value.subject}\n${value.body}`.match(/\{[a-z_]+\}/g)?.find((token) =>
    !["{user_name}", "{item_name}", ...(kind === "shipping" ? ["{courier_name}", "{tracking_id}"] : [])].includes(token));
  if (unknown) throw Error(`Unsupported placeholder ${unknown}.`);
  return { subject: value.subject.trim(), body: value.body.trim() };
}

export function validateOrderEmailTemplate(input: unknown) {
  return validateEmailTemplate("confirmation", input);
}

function itemNames(order: OrderEmailOrder) {
  const names = order.items.map(({ name, quantity }) => `${name}${quantity > 1 ? ` × ${quantity}` : ""}`);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0] || "your handmade piece";
}

type ShippingDetails = { courierName: string; trackingId: string };

function fillPlaceholders(value: string, order: OrderEmailOrder, html: boolean, details?: ShippingDetails) {
  return value.replace(/\{(user_name|item_name|courier_name|tracking_id)\}/g, (_token, key: string) => {
    const replacement = key === "user_name" ? order.name : key === "item_name" ? itemNames(order)
      : key === "courier_name" ? details?.courierName || "" : details?.trackingId || "";
    return html ? key === "item_name" ? `<strong>${escapeHtml(replacement)}</strong>` : escapeHtml(replacement) : replacement;
  });
}

function renderBodyHtml(body: string, order: OrderEmailOrder, details?: ShippingDetails) {
  const safe = escapeHtml(body.replace(/\*\*\{item_name\}\*\*/g, "{item_name}"))
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,
      (_whole, label: string, href: string) => `<a href="${href}" rel="noopener noreferrer">${label}</a>`)
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  return safe.split(/\n\s*\n/).map((paragraph) =>
    `<p style="margin:0 0 16px">${fillPlaceholders(paragraph, order, true, details).replace(/\n/g, "<br>")}</p>`).join("");
}

function renderBodyText(body: string, order: OrderEmailOrder, details?: ShippingDetails) {
  return fillPlaceholders(body.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, "$1"), order, false, details);
}

export function composeOrderEmail(order: OrderEmailOrder, template: OrderEmailTemplate = defaultOrderEmailTemplate) {
  template = withOrderTrackingReminder(template);
  const subject = fillPlaceholders(template.subject, order, false);
  const text = renderBodyText(template.body, order);
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.65;max-width:620px;margin:auto;color:#352b31;padding:20px">${renderBodyHtml(template.body, order)}</div>`;
  return { eventKey: `campus-crochet/confirmation/${order.id}`, to: [order.registeredEmail], subject, html, text };
}

export function composeManualEmail(kind: "shipping" | "received", order: OrderEmailOrder,
  template: OrderEmailTemplate = defaultEmailTemplates[kind], details?: ShippingDetails) {
  const subject = fillPlaceholders(template.subject, order, false, details);
  const text = renderBodyText(template.body, order, details);
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.65;max-width:620px;margin:auto;color:#352b31;padding:20px">${renderBodyHtml(template.body, order, details)}</div>`;
  return { to: order.registeredEmail, subject, html, text };
}
