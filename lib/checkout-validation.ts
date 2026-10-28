export type CheckoutCustomer = {
  name: string;
  email: string;
  phone: string;
  addressChoice: "Aditya Surampalem" | "Others";
  deliveryAddress: string;
  deliveryPin: string;
};

export function parseCheckoutCustomer(body: Record<string, unknown>, registeredEmail: string | undefined): CheckoutCustomer {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 80) throw Error("Please enter your full name.");
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!/^[6-9]\d{9}$/.test(phone)) throw Error("Please enter a valid 10-digit Indian mobile number.");
  if (!registeredEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registeredEmail))
    throw Error("Your registered email is unavailable. Please sign in again.");
  if (body.consent !== true) throw Error("Please agree to the order and privacy information.");
  if (body.addressChoice === "Others") {
    const address = typeof body.deliveryAddress === "string" ? body.deliveryAddress.trim() : "";
    if (address.length < 15 || address.length > 500)
      throw Error("Please enter your complete delivery address.");
    const deliveryPin = typeof body.deliveryPin === "string" ? body.deliveryPin.trim() : "";
    if (!/^[1-9]\d{5}$/.test(deliveryPin)) throw Error("Please enter a valid six-digit delivery PIN.");
    return { name, email: registeredEmail, phone, addressChoice: "Others", deliveryAddress: address, deliveryPin };
  }
  if (body.addressChoice !== "Aditya Surampalem") throw Error("Please select an address option.");
  return { name, email: registeredEmail, phone, addressChoice: "Aditya Surampalem", deliveryAddress: "", deliveryPin: "" };
}
