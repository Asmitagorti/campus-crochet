import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error('Provide the new administrator email.');
const app = initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_JSON)) });
const auth = getAuth(app), db = getFirestore(app);
let next;
try { next = await auth.getUserByEmail(email); }
catch (error) { if (error.code !== 'auth/user-not-found') throw error; }
if (next && (!next.emailVerified || !next.providerData.some(p => p.providerId === 'google.com'))) {
  throw Error('The new administrator must use verified Google sign-in.');
}
const ref = db.doc('admin_config/singleton');
const previousUid = await db.runTransaction(async tx => {
  const current = await tx.get(ref);
  const previousUid = current.data()?.uid;
  tx.set(ref, { uid: next?.uid ?? null, email, updatedAt: new Date().toISOString() });
  if (previousUid && previousUid !== next?.uid)
    tx.set(db.doc(`users/${previousUid}`), { role: 'customer' }, { merge: true });
  if (next) tx.set(db.doc(`users/${next.uid}`), { role: 'admin' }, { merge: true });
  return previousUid;
});
// The singleton switch immediately removes old access, including existing tokens.
if (previousUid && previousUid !== next?.uid) {
  const previous = await auth.getUser(previousUid);
  await auth.setCustomUserClaims(previousUid, { ...previous.customClaims, role: 'customer' });
  await auth.revokeRefreshTokens(previousUid);
}
if (next) await auth.setCustomUserClaims(next.uid, { ...next.customClaims, role: 'admin' });
const registry = (await ref.get()).data();
if (registry.email !== email || registry.uid !== (next?.uid ?? null)) throw Error('Transfer verification failed.');
if (previousUid && previousUid !== next?.uid && (await auth.getUser(previousUid)).customClaims?.role === 'admin')
  throw Error('Previous admin claim was not removed.');
console.log(next ? 'Administrator transferred and verified.' : 'Previous administrator removed. New administrator will bind on first verified Google sign-in.');
