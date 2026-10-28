import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
const paths = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);
const values = [
  "RAZORPAY_KEY_SECRET",
  "CLOUDINARY_API_SECRET",
  "CRON_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
]
  .map((k) => process.env[k])
  .filter((v) => v && v.length > 10);
let failed = false;
for (const path of paths) {
  let content;
  try {
    content = await readFile(path);
  } catch (error) {
    if (error.code === "ENOENT") continue;
    throw error;
  }
  if (
    values.some((v) => content.includes(Buffer.from(v))) ||
    content.includes(Buffer.from(["-----BEGIN", "PRIVATE KEY-----"].join(" ")))
  ) {
    console.error(`Private credential found in ${path}`);
    failed = true;
  }
}
if (failed) process.exitCode = 1;
else console.log("Repository secret check passed.");
