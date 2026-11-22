import { validateDestination } from "./indian-postcodes";

export type CheckoutCustomer = {
  name: string;
  email: string;
  phone: string;
  addressChoice: "Aditya Surampalem" | "Others";
  deliveryAddress: string;
  deliveryPin: string;
  addressLine1: string;
  areaStreet: string;
  city: string;
  state: string;
  landmark: string;
};

function addressField(body: Record<string, unknown>, key: string, label: string, min: number, max: number) {
  const value = typeof body[key] === "string" ? body[key].trim().replace(/\s+/g, " ") : "";
  if (value.length < min || value.length > max || /[\x00-\x1f\x7f]/.test(value))
    throw Error(`Please enter a valid ${label}.`);
  return value;
}

export function parseCheckoutCustomer(body: Record<string, unknown>, registeredEmail: string | undefined): CheckoutCustomer {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 80) throw Error("Please enter your full name.");
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!/^[6-9]\d{9}$/.test(phone)) throw Error("Please enter a valid 10-digit Indian mobile number.");
  if (!registeredEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registeredEmail))
    throw Error("Your registered email is unavailable. Please sign in again.");
  if (body.consent !== true) throw Error("Please agree to the order and privacy information.");
  if (body.addressChoice === "Others") {
    const addressLine1 = addressField(body, "addressLine1", "flat, house number or building", 3, 120);
    const areaStreet = addressField(body, "areaStreet", "area and street", 3, 120);
    const city = addressField(body, "city", "town or city", 2, 80);
    const state = addressField(body, "state", "state", 2, 80);
    const landmark = addressField(body, "landmark", "landmark", 0, 120);
    const deliveryPin = typeof body.deliveryPin === "string" ? body.deliveryPin.trim() : "";
    validateDestination(deliveryPin, state);
    const deliveryAddress = [addressLine1, areaStreet, city, state, landmark].filter(Boolean).join(", ");
    return { name, email: registeredEmail, phone, addressChoice: "Others", deliveryAddress,
      deliveryPin, addressLine1, areaStreet, city, state, landmark };
  }
  if (body.addressChoice !== "Aditya Surampalem") throw Error("Please select an address option.");
  return { name, email: registeredEmail, phone, addressChoice: "Aditya Surampalem", deliveryAddress: "", deliveryPin: "",
    addressLine1: "", areaStreet: "", city: "", state: "", landmark: "" };
}
