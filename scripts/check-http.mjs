const paths = [
  "/",
  "/shop",
  "/about",
  "/contact",
  "/journey",
  "/journey/the-hook-that-started-it-all",
  "/account",
  "/checkout?buy=bunny&quantity=2",
  "/products/stitch",
  "/products/coaster",
  "/products/bunny",
  "/products/minion",
  "/products/tulips",
  "/products/beanie",
  "/products/flowers",
  "/products/bag",
  "/products/pastel-bag",
  "/products/round-coasters",
  "/privacy",
  "/care",
  "/policies",
  "/admin",
  "/studio",
  "/products/not-a-product",
];
async function main() {
  let failures = 0;
  for (const path of paths) {
    const r = await fetch(`http://localhost:3000${path}`),
      text = await r.text(),
      missing = path === "/products/not-a-product";
    const validStatus = missing ? [200, 404].includes(r.status) : r.status === 200;
    const validMissing = !missing || (text.includes("This little thing wandered off") && text.includes('name="robots" content="noindex"'));
    if (!validStatus || !validMissing || text.includes("A little tangled thread")) {
      console.log(`FAIL ${path} ${r.status}`);
      failures++;
    } else console.log(`PASS ${path} ${r.status}`);
  }
  for (const path of [
    "/api/admin",
    "/api/admin/products",
    "/api/admin/upload",
    "/api/admin/content",
  ]) {
    const r = await fetch(
      `http://localhost:3000${path}`,
      path === "/api/admin"
        ? {}
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          },
    );
    if (r.status >= 400 && r.status < 500)
      console.log(`PASS anonymous denied ${path}`);
    else {
      console.log(`FAIL anonymous access ${path}: ${r.status}`);
      failures++;
    }
  }
  if (failures) process.exitCode = 1;
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
