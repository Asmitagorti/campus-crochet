import { getDetails } from "@devzoy/indian-pincode";
import { indianStates } from "./indian-states";

export function validateDestination(pin: string, state: string): void {
  if (!/^[1-9]\d{5}$/.test(pin)) throw Error("Please enter a valid six-digit delivery PIN.");
  if (!indianStates.includes(state as typeof indianStates[number]))
    throw Error("Please select an Indian state or union territory.");
  const details = getDetails(pin);
  if (!details) throw Error("This PIN is not in the Indian postal directory. Please check it.");
  if (!details.states.includes(state))
    throw Error("The delivery PIN does not match the state you selected.");
}
