import { firestore, adminAuth } from "../lib/firebase-admin";
import { products } from "../lib/catalog";
import { journal } from "../lib/journal";
import { defaultSettings } from "../lib/site-settings";
import { media } from "../lib/media";
async function main() {
  const f = firestore();
  let count = 0;
  for (const p of products) {
    const ref = f.doc(`products/${p.id}`);
    await f.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      if (!doc.exists) {
        tx.create(ref, {
          ...p,
          details: p.details.map(([key, value]) => ({ key, value })),
          active: true,
          revision: 1,
          createdAt: new Date().toISOString(),
        });
        count++;
      }
    });
  }
  for (const p of journal) {
    const ref = f.doc(`journey/${p.slug}`);
    await f.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      if (!doc.exists)
        tx.create(ref, {
          ...p,
          image: media(p.image),
          published: true,
          revision: 1,
        });
    });
  }
  const ref = f.doc("site_content/settings");
  await f.runTransaction(async (tx) => {
    if (!(await tx.get(ref)).exists)
      tx.create(ref, {
        ...defaultSettings,
        heroImage: media(defaultSettings.heroImage),
        revision: 1,
      });
  });
  console.log(
    `Firestore catalogue ready. ${count} new products seeded with 25 in stock each. Existing stock preserved.`,
  );
  console.log("Journey entries and editable site content ready.");
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
