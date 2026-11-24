// Rebuild the small, bundled city directory after updating indian-pincode-geo.
// Source and license attribution: see lib/postal-places.ATTRIBUTION.md.
const fs = require("node:fs");
const path = require("node:path");
const { getPincodes, lookup } = require("@devzoy/indian-pincode-geo");

const placesByPin = {};
for (const pin of getPincodes()) {
  const byState = {};
  for (const office of lookup(pin)) {
    if (!office.state) continue;
    const places = byState[office.state] ??= new Set();
    if (office.officeName) places.add(office.officeName);
    if (office.district) places.add(office.district);
  }
  const states = Object.fromEntries(
    Object.entries(byState).map(([state, places]) => [state, [...places]]),
  );
  if (Object.keys(states).length) placesByPin[pin] = states;
}

const destination = path.join(__dirname, "../lib/postal-places.json");
fs.writeFileSync(destination, JSON.stringify(placesByPin));
console.log(`Wrote ${Object.keys(placesByPin).length} PINs to ${destination}`);
