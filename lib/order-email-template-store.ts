import "server-only";
import { adminDatabase } from "./supabase-admin";
import { defaultEmailTemplates, validateEmailTemplate, type EmailKind } from "./order-email";

export const ORDER_EMAIL_TEMPLATE_KEY = "order_confirmation_template";
export const EMAIL_TEMPLATE_KEYS: Record<EmailKind, string> = {
  confirmation: ORDER_EMAIL_TEMPLATE_KEY,
  shipping: "order_shipping_template",
  received: "order_received_template",
};

export async function loadEmailTemplate(kind: EmailKind) {
  const { data, error } = await adminDatabase().from("site_content")
    .select("data,revision").eq("key", EMAIL_TEMPLATE_KEYS[kind]).maybeSingle();
  if (error) throw error;
  return {
    template: data ? validateEmailTemplate(kind, data.data) : defaultEmailTemplates[kind],
    revision: data?.revision ?? 0,
  };
}

export function loadOrderEmailTemplate() {
  return loadEmailTemplate("confirmation");
}
