# Security and transaction verification

## Trust boundaries

Only Google-issued, verified Firebase users can place orders. Customers cannot grant themselves roles. The single admin requires both an Admin SDK custom claim and a matching singleton UID. The server verifies Firebase tokens (including revocation) before privileged operations. Firestore rules deny all browser writes to roles, products, stock, orders, payment ownership, messages and internal records. Browser access does not bypass the server checks.

Prices are read from Firestore on the server and checked again in the reservation transaction. Amounts are integer INR paise. Payment signatures use timing-safe comparison, and the server checks the payment's order, currency, amount and captured status with Razorpay.

Product/content editors use revision checks to reject stale writes. Stock reservation and release also increment product revisions, so an older admin form cannot overwrite a concurrent purchase's stock change.

## Atomic database operations

Firestore transactions atomically create the order, unique idempotency mapping, stock reservation and reconciliation record. A competing checkout cannot reserve an already sold unit. Confirmation writes paid status and unique payment ownership together. Cancellation restores reserved inventory only while the order is pending/creating and deletes the reservation in the same transaction. Repeated callbacks and cancellations are idempotent.

Firestore database commits are atomic and isolated; they cannot form a distributed ACID transaction with the external Razorpay API or Cloudinary. This boundary is handled with persisted states, idempotency, signed callbacks and reconciliation. Do not interpret these tests as a guarantee against every failure mode.

## Executed checks

Live Firestore tests used an isolated temporary test product (excluded from the public catalogue) and removed the fixtures afterwards:

- Two concurrent requests for the final unit: exactly one committed.
- Two cancellation attempts: stock restored exactly once.
- Duplicate paid callbacks: one paid record, no additional stock deduction.
- Cancellation after payment: rejected by the state transition; stock stayed deducted.
- Forged HMAC: rejected.
- Razorpay Orders API: accepted an unpaid test order with `currency=INR` and `amount=100` paise. No charge or payment capture occurred.

The local Firebase emulator passed 15 access-control cases, including own-order access, cross-customer denial, role escalation denial, forged paid-order denial, singleton admin matching, direct admin/browser stock-write denial, and draft-content privacy. The cloud rules-test API lacked permission; the emulator was used instead. The rules have not been published.

HTTP route checks passed for all top-level pages, all ten product details, a Journey article, missing-product 404 handling and anonymous denial on all four admin data/upload endpoints.

Production compilation and TypeScript checks pass. Dependency audit reports no known vulnerabilities at the checked lockfile. Authenticated Google login, the visual admin UI and the complete Razorpay checkout success/failure flow still need an interactive browser smoke test; the preview's browser access policy prevented automated visual checks.

Implementation references: [Razorpay Standard Checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/), [Firebase transaction isolation](https://firebase.google.com/docs/firestore/transaction-data-contention), [Cloudinary signed uploads](https://cloudinary.com/documentation/upload_images).
