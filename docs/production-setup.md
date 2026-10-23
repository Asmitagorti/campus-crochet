# Production setup

## Firebase

1. Enable **Google** as the sign-in provider in Firebase Authentication. Add `localhost` for local testing and the real production hostname to authorised domains. Other providers are not accepted by the server.
2. Publish the exact contents of `firestore.rules` in the Firebase Console under Firestore → Rules, or use the Firebase CLI with the project selected. The rules have been tested locally; they have not been published automatically.
3. Configure the TTL field for `request_limits.expiresAt` using `firestore.indexes.json` or the Google Cloud Console. TTL is housekeeping; request enforcement also checks the expiry time directly.
4. Production credentials: use `FIREBASE_PROJECT_ID` and secret-managed `FIREBASE_ADMIN_JSON`, or Application Default Credentials on Google Cloud. Do not deploy the Downloads service-account file or commit it.
5. Set `ADMIN_EMAIL` to the designated administrator address and sign in with that verified Google account. The server binds one UID to `admin_config/singleton`, creates the customer/admin profile and sets the custom role claim. There is no need to edit role fields in the browser. The admin link appears only in that account; `/studio` also checks authorisation on every data operation.

## Razorpay

The integration uses the Orders API on the server, integer paise amounts and currency `INR`. The browser receives only the public key and provider order ID. Payment verification validates the server-stored order ID, HMAC signature, provider payment amount/currency and captured status before confirming the order.

1. Keep test keys for testing. Replace `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` with live keys only for the production environment; never prefix the secret with `NEXT_PUBLIC_`.
2. Set `SITE_ORIGIN` to the exact HTTPS production origin.
3. Run a successful and failed payment smoke test, verify the matching order in the studio, then verify pickup/fulfilment handling.
4. Do not mix test and live orders in one Firestore project for a real launch. Use a separate production project/database or archive/remove test records after review and before accepting live customers.

## Scheduled reconciliation

Stock is reserved transactionally before a payment order is created. The browser releases unpaid reservations after a verified cancellation. To handle closed tabs or a missing callback, schedule `/api/cron/reconcile` with your hosting scheduler with `Authorization: Bearer CRON_SECRET`. The handler checks Razorpay before releasing expired reservations and confirms captured/authorised payments. `vercel.json` uses one daily invocation at 00:00 UTC, compatible with Vercel Hobby. This is around 05:30 IST, with Vercel Hobby timing flexibility. Abandoned reservations may therefore remain held until the next daily cleanup. Successful browser verification and verified browser cancellations update orders immediately. If a browser closes before verification completes, payment status is recovered by reconciliation. If faster cleanup is needed, use a hosting plan that supports more frequent jobs or an independently configured authenticated scheduler. Without this job, abandoned reservations remain held until reconciled; this avoids silently selling stock committed to an unresolved payment.

Do not configure Firestore TTL on payment reservations: releasing stock must be a transaction after checking payment state, not a raw document deletion.

## Cloudinary

Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and secret-managed `CLOUDINARY_API_SECRET`. Only the single admin can use the upload endpoint. Image type and size are checked, and product image URLs must belong to this Cloudinary cloud. No unsigned public upload preset is required. The existing images have already been uploaded.

## Remaining launch checks

- Confirm the proposed INR prices, exact product measurements and material descriptions in the studio.
- Sign in with the designated Google account to finish the admin binding and exercise the authenticated studio and checkout in the real browser.
- Publish the supplied Firestore rules, set production secrets, and activate reconciliation.
- Check the pages on real mobile and desktop browsers. Automated browser visual verification was blocked by the local preview's browser access policy during implementation.
- Review store policies and customer-facing fulfilment details for your launch.

The application is built and connected locally. No production site deployment, live payment or automatic rules publication has been performed.

### Browser security configuration

`next.config.ts` applies MIME-sniffing and framing protection, referrer and permissions policies, popup-compatible COOP, production-only one-year HSTS, and private/no-store API responses. Framework identification and production browser source maps are disabled. HSTS intentionally omits preload and includeSubDomains so deploying this app does not commit other subdomains to HTTPS.

`proxy.ts` issues a fresh CSP script nonce for each page request and forwards the policy to Next's renderer. Checkout forwards the nonce to the Razorpay script. Production permits neither inline scripts without a nonce nor eval. Inline styles remain permitted for Motion and checkout styling. Cloudinary images, Google authentication and Razorpay have explicit resource allowances. HTTPS upgrades are production-only; local development retains hot reload support. Keep the root layout dynamically rendered when using nonces.

Run `node scripts/check-security-headers.mjs` against a production server on port 3003 (or set `TEST_ORIGIN`) to verify response headers, unique nonces, script nonce coverage, and API caching. An interactive Google sign-in and Razorpay test checkout remain required before launch; HTTP tests cannot verify third-party popup behavior.

The project targets Node.js 24.x on Vercel. A scoped dependency override keeps `jwks-rsa` on CommonJS-compatible `jose` 5.10.0: its current synchronous `require('jose')` otherwise fails on hosts that disable `require(ESM)`. Keep the lockfile in deployments and run `npm run check:firebase-runtime` when updating Firebase authentication dependencies.

### Firebase credential value

The ignored `.env.local` now contains the complete service-account object in `FIREBASE_ADMIN_JSON`, encoded as single-line JSON. The application no longer reads a local JSON file path.

For a hosting dashboard, copy only the JSON value into the server-side `FIREBASE_ADMIN_JSON` environment variable; omit the surrounding dotenv single quotes. Keep the private key's JSON `\n` escapes intact. Do not use a `NEXT_PUBLIC_` prefix. Restart or redeploy after changing production environment variables.
