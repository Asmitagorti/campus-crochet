import "server-only";
import {
  getApps,
  initializeApp,
  applicationDefault,
  cert,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
export function adminApp() {
  return (
    getApps()[0] ||
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || "college-corchet",
      credential: process.env.FIREBASE_ADMIN_JSON
        ? cert(JSON.parse(process.env.FIREBASE_ADMIN_JSON))
        : applicationDefault(),
    })
  );
}
export const adminAuth = () => getAuth(adminApp());
export const firestore = () => getFirestore(adminApp());
export async function requireUser(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer "))
    throw Error("Please sign in with Google to continue.");
  const token = await adminAuth().verifyIdToken(header.slice(7), true);
  if (token.firebase.sign_in_provider !== "google.com" || !token.email_verified)
    throw Error("Please use a verified Google account.");
  return token;
}
export async function requireAdmin(request: Request) {
  const token = await requireUser(request),
    record = await firestore().doc("admin_config/singleton").get();
  if (token.role !== "admin" || record.data()?.uid !== token.uid)
    throw Error("Administrator access required.");
  return token;
}
