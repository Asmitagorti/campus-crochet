import "server-only";
import { adminDatabase } from "./supabase-admin";
import type { CheckoutCustomer } from "./checkout-validation";

export async function loadSavedCheckoutDetails(userId: string) {
  const { data, error } = await adminDatabase().from("saved_checkout_details")
    .select("name,phone,address_choice,address_line1,area_street,city,state,delivery_pin,landmark")
    .eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data ? {
    name: data.name,
    phone: data.phone,
    addressChoice: data.address_choice,
    addressLine1: data.address_line1,
    areaStreet: data.area_street,
    city: data.city,
    state: data.state,
    deliveryPin: data.delivery_pin,
    landmark: data.landmark,
  } : null;
}

export async function saveCheckoutDetails(userId: string, customer: CheckoutCustomer) {
  const previous = customer.addressChoice === "Aditya Surampalem"
    ? await loadSavedCheckoutDetails(userId) : null;
  const { error } = await adminDatabase().from("saved_checkout_details").upsert({
    user_id: userId,
    name: customer.name,
    phone: customer.phone,
    address_choice: customer.addressChoice,
    address_line1: previous?.addressLine1 || customer.addressLine1,
    area_street: previous?.areaStreet || customer.areaStreet,
    city: previous?.city || customer.city,
    state: previous?.state || customer.state,
    delivery_pin: previous?.deliveryPin || customer.deliveryPin,
    landmark: previous?.landmark || customer.landmark,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) throw error;
}
