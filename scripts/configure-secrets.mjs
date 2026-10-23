import { randomBytes } from "node:crypto";
import { readFile, appendFile } from "node:fs/promises";
const file = await readFile(".env.local", "utf8");
for (const key of ["RAZORPAY_WEBHOOK_SECRET", "CRON_SECRET"])
  if (!file.includes(`${key}=`))
    await appendFile(
      ".env.local",
      `\n${key}=${randomBytes(32).toString("hex")}\n`,
    );
console.log("Webhook and scheduled-job secrets configured locally.");
