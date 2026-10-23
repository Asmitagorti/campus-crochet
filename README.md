# Campus-Crochet

A dynamic Next.js App Router storefront with TypeScript, Tailwind CSS 4, Motion, Firebase Google authentication, Firestore, Cloudinary images and Razorpay checkout in INR.

## Run

Use Node.js 24 or a supported Node.js LTS runtime. Copy `.env.example` to `.env.local` and configure server credentials. Then run:

```sh
npm install
npm run dev
```

`npm run build` creates the production build; `npm start` runs it. No credentials are committed. Firebase Admin credentials are loaded from `FIREBASE_ADMIN_JSON` in the ignored environment file. Set the same server-only variable in production, or use Google Application Default Credentials. No local service-account file path is required.

## Pages and functionality

- `/shop`: live Firestore catalogue, collection filtering, search, sorting, stock filter and saved favourites.
- `/products/[slug]`: individual product photos, INR price, availability, quantity, buy-now checkout, description, specifications and care.
- `/about`, `/contact`, `/journey`, `/journey/[slug]`: studio story, persisted enquiries, WhatsApp/call links and editable published chapters.
- `/account`: Google sign-in, order history and favourites. New users are customers by default.
- `/checkout`: server-priced INR checkout with Razorpay, stock reservations and payment recovery.
- `/studio`: private administrator workspace for product creation/editing, Cloudinary uploads, stock, publishing, order fulfilment, messages, Journey and site content.
- `/privacy`: data and payment handling information.

Theme and bag persist locally. Signed-in favourites persist in Firestore. Storefront content is server-rendered from Firestore; the client refreshes stock/content on navigation, focus and at 30-second intervals. Shared design retains the original parchment, cocoa, blush and lavender theme; category and product grids use two columns on small screens.

## Data and setup

`npm run bootstrap` inserts only missing products, initial stock of 25 per product, the three Journey entries and site content. It never resets existing stock. Initial catalogue prices are proposed launch prices and are editable in the studio.

All 15 current site photos are hosted on Cloudinary; the manifest is in `lib/media-map.json`. Originals remain in the repository. Admin uploads are server-authorised and sent to Cloudinary using server-only credentials.

The single administrator is bound to the verified Google address configured as `ADMIN_EMAIL`. The first sign-in creates `admin_config/singleton` transactionally and adds the Admin SDK custom claim. Both the claim and singleton UID must match for admin access. Changing a browser profile or a role field cannot grant administrator rights. No public admin signup endpoint exists.

See `docs/production-setup.md`, `docs/security-and-transactions.md` and `firestore.rules` before launch.

## Verification

- `npm run typecheck`
- `npm run build`
- `node scripts/check-http.mjs` against a running local server
- `npm run check:transactions` uses isolated temporary Firestore fixtures and an unpaid Razorpay test order. No payment is made; fixture records are cleaned up.
- `npx --yes --package firebase-tools firebase emulators:exec --only firestore --project demo-campus-crochet --config firebase.test.json "node --import tsx scripts/check-rules-emulator.ts"` runs 15 security rule cases without touching production rules.

## Launch scope

Campus pickup is the only fulfilment option, with no delivery charge. Automatic outbound email/WhatsApp notifications and carrier shipping are not connected. Messages are visible in the studio. Use test Razorpay keys during review, then switch to live keys, set the production origin, deploy Firestore rules and run the production payment smoke test.
