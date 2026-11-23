import { getDetails, lookup } from "@devzoy/indian-pincode-geo";
import { indianStates } from "./indian-states";

function normalizePlace(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim()
    .replace(/\b(?:G P O|GPO|H O|HO|S O|SO|B O|BO|P O|PO)\b/g, " ")
    .replace(/\bBANGALORE\b/g, "BENGALURU")
    .replace(/\bBOMBAY\b/g, "MUMBAI")
    .replace(/\bMADRAS\b/g, "CHENNAI")
    .replace(/\bCALCUTTA\b/g, "KOLKATA")
    .replace(/\bMYSORE\b/g, "MYSURU")
    .replace(/\bALLAHABAD\b/g, "PRAYAGRAJ")
    .replace(/\s+/g, " ").trim();
}

function matchesPlace(candidate: string, city: string): boolean {
  return candidate === city || (city.length >= 4 &&
    candidate.startsWith(`${city} `));
}

export function validateDestination(pin: string, state: string, city: string): void {
  if (!/^[1-9]\d{5}$/.test(pin)) throw Error("Please enter a valid six-digit delivery PIN.");
  if (!indianStates.includes(state as typeof indianStates[number]))
    throw Error("Please select an Indian state or union territory.");
  const details = getDetails(pin);
  if (!details) throw Error("This PIN is not in the Indian postal directory. Please check it.");
  if (!details.states.includes(state))
    throw Error("The delivery PIN does not match the state you selected.");
  const town = normalizePlace(city);
  if (city.trim().length > 80 || town.length < 2) throw Error("Please enter a valid town or city.");
  // One PIN can serve several post offices; compare the chosen state's office and district names.
  const offices = lookup(pin).filter((office) => office.state === state);
  const places = offices.length
    ? offices.flatMap((office) => [office.officeName, office.district || ""])
    : details.districts;
  const matchesDelhi = state === "DELHI" && (town === "DELHI" || town === "NEW DELHI");
  if (!matchesDelhi && !places.map(normalizePlace).some((place) => matchesPlace(place, town)))
    throw Error("The delivery PIN does not match the town or city entered. Check the PIN and town name.");
}
