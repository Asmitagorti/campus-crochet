import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
async function files(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...(await files(full)));
    else result.push(full);
  }
  return result;
}
const secrets = [
  process.env.RAZORPAY_KEY_SECRET,
  process.env.CLOUDINARY_API_SECRET,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  process.env.RESEND_API_KEY,
  process.env.CRON_SECRET,
].filter(Boolean);
let found = 0;
for (const file of await files(".next/static")) {
  const text = await readFile(file, "utf8");
  if (secrets.some((secret) => text.includes(secret))) {
    console.error(`Server secret found in client file: ${file}`);
    found++;
  }
}
if (found) process.exitCode = 1;
else
  console.log(
    "PASS: no configured server secret found in browser assets.",
  );
