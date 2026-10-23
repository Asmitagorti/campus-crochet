import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { readFile } from "node:fs/promises";
const app = initializeApp({
    credential: cert(
      JSON.parse(
        await readFile(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"),
      ),
    ),
  }),
  db = getFirestore(app);
try {
  await db.collection("admin_config").limit(1).get();
  console.log("Firestore connection verified.");
} catch (e) {
  console.error("Firestore connection failed:", e.code, e.message);
  process.exitCode = 1;
}
try {
  const user = await getAuth(app).getUserByEmail(process.env.ADMIN_EMAIL);
  console.log("Designated administrator account exists.");
  const ref = db.doc("admin_config/singleton");
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists && snap.data().uid !== user.uid)
      throw Error("Another administrator is already registered.");
    if (!snap.exists)
      tx.create(ref, {
        uid: user.uid,
        email: user.email,
        createdAt: new Date().toISOString(),
      });
  });
  await getAuth(app).setCustomUserClaims(user.uid, {
    ...user.customClaims,
    role: "admin",
  });
  console.log("Single administrator role configured.");
} catch (e) {
  if (e.code === "auth/user-not-found")
    console.log(
      "Administrator will be bound securely on first Google sign-in.",
    );
  else {
    console.error("Administrator setup failed:", e.code || e.message);
    process.exitCode = 1;
  }
}
