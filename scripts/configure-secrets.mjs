import { randomBytes } from "node:crypto";
import { readFile, appendFile } from "node:fs/promises";
const file = await readFile(".env.local", "utf8");
for (const key of ["CRON_SECRET"])
  if (!file.includes(`${key}=`))
    await appendFile(
      ".env.local",
      `\n${key}=${randomBytes(32).toString("hex")}\n`,
    );
console.log("Scheduled-job secret configured locally.");
