# Campus Crochet implementation and rollout

The implementation is in the local workspace. Production activation still requires the database migration, payment credentials/webhook and deployment configuration.

| Request | Implementation |
| --- | --- |
| Remove AI mode | Removed navigation/screen; retired API returns 410. |
| Remove unusual symbols | Replaced decorative emoji UI with text navigation and consistent typography. |
| Route requests and support to Zoho | DB transactions queue Resend emails to support@campus-crochet.tech. |
| Support tabs and browsers | Real URLs, persisted account carts, version conflict checks and periodic/focus refresh. Guest cross-tab updates verified in the browser. |
| Remove fixed footer categories | Footer uses Collections; catalog categories come from the DB. |
| Correct footer navigation | Collections, requests, creations, tracking, policy, support and story have real destinations. |
| Repair tracking and custom orders | Authenticated DB queries, order history, accepted-quote checkout and verified payment writes. |
| Redesign custom form | New design/detail fields and confirmation without a promise of personal replies. |
| Admin logistics and tracking | Customer, item, price, payment, stage, event and pickup details; versioned DB edits. |
| Completion message | Required pickup location and transactional pickup email job; admin failure/retry visibility. Email is the initial channel. |
| Remove duplicate search icon | Navbar search removed; collection page retains a useful search field. |
| All admin requests and verification | Paginated DB queries and server-side verified-email allowlist with OTP sign-in. |
| DB-based past creations | Completed purchased items and published final photos; similarity/static cards removed. |
| Improve UI | Forest/paper palette, editorial headings, responsive layouts and a clear tracking timeline. |

## Rollout order

1. Apply `supabase/migrations/202610040001_store_operations.sql` once to the existing Supabase project. The current service-role key cannot execute DDL. SQL Editor or a management token is needed.
2. Copy the deployment environment settings from `.env.example`, confirm the admin email allowlist and keep secrets server-side.
3. Test admin/customer OTP, persisted custom requests/support tickets, two signed-in browsers and order tracking on the migrated database.
4. Configure Razorpay keys, automatic capture and the `payment.captured` webhook; complete a gateway test payment and a custom-quote payment.
5. Mark a paid order completed with pickup details and verify the customer message. Configure the authenticated notification retry scheduler.
6. Deploy the production build and repeat the main customer/admin checks on the deployed domain.

## Verification performed

- Production build and TypeScript passed.
- PostgreSQL tests use the real migration and verify stock, idempotency, payment amounts, tracking conflicts, customer isolation, cart versions and transactional email jobs.
- October 5 checks: all 23 tests passed, including account-bound cart routes and legacy customer logistics. Cart writes reject a changed session; custom-request views reset between accounts, and recovered cart loads clear old errors.
- `npm run db:check` reads live schema metadata without reading customer records or modifying data. The required tracking/custom-request/cart/notification schema and transactional functions are still absent.
- Browser checks verified DB products, working collection/tracking/custom-form navigation and cart changes/removal across two tabs.
- Resend confirmed campus-crochet.tech is verified and accepted a setup email. Its delivery is delayed; public DNS checks found no root-domain MX records. Configure the Zoho account-specific MX records and verify that the support mailbox exists.

Authenticated live DB and gateway tests remain pending until the required migration and credentials are available. No SMS provider or external scheduler has been provisioned.
