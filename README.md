# Campus Crochet

Next.js 16 storefront with Supabase inventory, account carts, custom requests, tracking, email-verified administration and Resend notifications. Razorpay payments are verified on the server.

## Development

Copy `.env.example` to an ignored `.env.local` and fill in credentials. Existing `.env` files work too. Service-role, Resend, Razorpay, management and cron secrets must remain on the server. Use Node.js 20.9 or later.

```sh
npm install
npm run dev
npm run lint
npm test
npm run build
```

Transaction tests run the actual migration against a disposable local PostgreSQL engine. They do not modify the live database.

## Required database upgrade

The current live DB is missing custom requests, carts, tracking events and notification tables. Run `supabase/migrations/202610040001_store_operations.sql` once in Supabase SQL Editor before enabling these flows. It preserves orders/products, adds transactional functions, replaces permissive commerce policies with customer-scoped reads, and creates a private final-photo bucket. Take a production backup before changing its schema.

Alternatively, set `SUPABASE_ACCESS_TOKEN` locally and run `npm run db:migrate`. The runner records the SQL hash and prevents reapplication with changed contents. The service-role key alone cannot run SQL DDL. If using SQL Editor, do not rerun the same migration; create follow-up migrations for future changes.

Run `npm run db:check` before and after migration. It reads schema metadata and lists missing tables, columns and transactional functions without reading customer records or changing data. It also checks whether payment credentials and the retry secret are configured.

After applying it, verify sign-in, custom requests, support tickets, customer tracking and admin updates against the live DB. Missing schema returns an explicit setup error instead of fabricated data.

## Authentication and admin

`ADMIN_EMAILS` is a server-side comma-separated allowlist. Its current local value is `asmileis4evr@gmail.com`; change it if needed. Admin access requires a verified Supabase session and an allowlisted email. Client metadata and the profile role cannot grant it. Sign in with an emailed OTP. Student domains are listed in `app/api/auth/send-otp/route.ts`. Supabase Auth must permit email OTP/magic-link verification. Resend delivers the codes; rate limits persist in the DB.

`/admin` shows all orders, customer snapshots, purchased prices, payment references, tracking events, custom requests, support tickets and notification status. `/admin/products` manages live inventory; hiding a product preserves order history.

## Email and pickup

During local development only (`npm run dev`), a missing `cc_rate_limit` function uses a process-local limit of three OTP requests per email per ten minutes. It survives hot reloads but resets when the development server restarts. Network/database errors do not trigger this fallback. Production still requires the shared database limiter and fails closed until the migration is applied.

Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO` and `SITE_URL` in the deployment environment. The configured sender is `notifications@campus-crochet.tech`, with replies to `support@campus-crochet.tech`. `npm run email:check` checks sending-domain verification and inbound MX records. `node scripts/send-test-email.cjs` sends one deduplicated setup email to the support inbox.

On October 4, 2026, Resend confirmed the sending domain is verified, but the setup message's latest event was `delivery_delayed`. MX lookups through both Cloudflare and Google returned no root-domain MX records. Configure the exact records shown in Zoho Admin Console → Domains → campus-crochet.tech → Email Configuration → MX at the domain's active DNS provider, and ensure the support mailbox exists. Values vary by Zoho data center: use the account-specific values rather than guessing `.com` or `.in`. Keep Resend's sending-subdomain records. Follow [Zoho's inbound mail setup](https://www.zoho.com/mail/help/adminconsole/configure-email-delivery.html), verify propagation, then test actual inbox delivery.

Custom requests/support tickets and their email jobs are saved in the same DB transaction. Both route to `support@campus-crochet.tech`. Marking a paid order ready/completed requires a pickup location and queues an email to its customer with the location/instructions. Failures remain visible and retryable in admin. There is one pickup job per order: set final pickup details before marking ready. Email is implemented; SMS needs a separate provider.

For unattended retries and reservation cleanup, configure a scheduler to call `GET /api/notifications/process` every few minutes with `Authorization: Bearer <CRON_SECRET>`. Generate a long random secret and store it in the hosting environment and scheduler. Each call claims up to 10 jobs, retries with backoff up to eight attempts and recovers stale claims. An external scheduler is not provisioned by this repository. Submissions/tracking changes also attempt immediate delivery.

Email follows [Resend's idempotency guidance](https://resend.com/docs/dashboard/emails/idempotency-keys); the DB retains the long-lived event record. Provider acceptance is recorded as sent. Inspect inbox delivery/bounces in Resend.

## Payments and stock

Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`. Register `/api/razorpay/webhook` for `payment.captured` and enable automatic capture. Test a complete checkout with test keys before going live. Razorpay credentials are currently absent locally.

Checkout uses DB prices, locks stock and stores an idempotent reference. Verification checks the server's gateway order, signature, captured amount and currency. Custom quotes create unpaid orders after acceptance. Duplicate webhooks cannot move tracking backwards. See [Razorpay verification](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/).

Unpaid catalog reservations without attached gateways expire after 30 minutes. Gateway-linked orders remain payable and retain stock. Admin can cancel an abandoned unpaid order. If its gateway later receives money, the webhook fails for reconciliation rather than recording fulfillment against released stock. Refunds must be handled with the payment provider; the app does not automate refunds.

## Multiple tabs and browsers

Guest carts synchronize through browser storage. Signed-in carts are stored in Supabase and shared across browsers for the same account. Versioned saves retry conflicts. Lists refresh on focus, online recovery and every 20 seconds while visible; orders also subscribe to Realtime when enabled. Checkout removes purchased quantities while preserving later additions.

Cart reads and writes bind to the expected account as well as the verified session. An account change between a read and write rejects the write instead of transferring another account's cart. Successful refreshes clear old errors; switching accounts resets custom-request results.

## Photos and navigation

Products, categories and ordered product photos are DB-backed. The footer has Collections and real page links without fixed product categories. URLs support refresh and new tabs. AI navigation and the duplicate navbar search are removed.

`/admin/creations` lists completed/collected purchases. Upload JPG/PNG/WebP final photos under 5 MB, edit captions and explicitly publish them. `/creations` shows only published photos through signed storage URLs, without customer/order data or similarity scoring.

## Release checks

1. Apply the migration and configure deployment secrets.
2. Verify the admin allowlist and emailed OTP.
3. Configure the Razorpay capture webhook and test a payment.
4. Update tracking, mark the test paid order completed with a pickup location, and verify the customer email and tracking.
5. Configure the retry scheduler and deploy the tested build.

Live migration and payment verification remain necessary when those credentials are unavailable during local development.
