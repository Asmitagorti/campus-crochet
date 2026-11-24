import "server-only";
import { adminDatabase } from "./supabase-admin";
import { defaultOrderEmailTemplate, validateOrderEmailTemplate } from "./order-email";

export const ORDER_EMAIL_TEMPLATE_KEY = "order_confirmation_template";

export async function loadOrderEmailTemplate() {
  const { data, error } = await adminDatabase().from("site_content")
    .select("data,revision").eq("key", ORDER_EMAIL_TEMPLATE_KEY).maybeSingle();
  if (error) throw error;
  return {
    template: data ? validateOrderEmailTemplate(data.data) : defaultOrderEmailTemplate,
    revision: data?.revision ?? 0,
  };
}
