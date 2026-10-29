# Campus Crochet

Campus Crochet is a Next.js website with a manually switchable design poll and storefront. It uses Supabase Auth, Postgres and Storage, Razorpay payments in shop mode, and Resend order email. The existing catalogue and visual design remain in the project.

## Local setup

Use Node.js 24. Copy `.env.example` to ignored `.env.local` and fill in the server credentials. Then run:

```sh
npm install
npm run dev
```

Run `supabase/migrations/20261027_campus_storefront.sql`, `supabase/migrations/20261027_designated_admin.sql`, and `supabase/migrations/20261027_admin_password.sql` in that order in the Supabase SQL Editor before loading the site. The first keeps existing rows and adds the storefront fields, transaction wrappers, content tables and restricted permissions. The second confines admin access to `asmileis4evr@gmail.com`. The third stores only a salted admin password hash and makes product images writable only through the protected server route. Run `npm run seed:supabase` after the migrations to add the existing catalogue, Journey and site settings without overwriting existing products. Product photos are in the public Supabase Storage `product_images` bucket. For a fresh project, run `node --use-system-ca --import tsx --env-file=.env.local scripts/migrate-images-to-supabase.mjs --apply` after seeding to upload the original media and replace stored URLs.

The public storefront reads products and content from Supabase. Registered users save their bag and favourites per account. `/account` shows each customer's own orders and tracking stages. `/admin` asks the designated administrator for a separate password after Google sign-in before showing orders, product editing, messages, Journey and site content.

The live mode starts as a no-payment poll holding page after the poll migrations are applied. In `/admin` → Polls, the designated admin can create a draft, add items with a name and up to eight pictures, reorder saved pictures, and manually open a round. Open items can gain and reorder detail pictures while keeping their original cover. Visitors can hover to watch the pictures cycle, open them on touch screens, choose several designs, and sign in with Google to submit one final ballot per round. Public totals update regularly. `/admin` → Analytics shows approximate browser visitors, visits and focused-tab time. The admin can switch to the selling storefront without redeploying. The complete storefront before poll mode is preserved in local Git commit `c8e3554` on branch `codex/full-storefront-snapshot-2026-10-28`.

In shop mode, Aditya Surampalem delivery is included. “Others” checkout requires a verified destination PIN and packed-weight rate entered in `/admin`; the server adds that delivery charge before payment. Checkout requires a verified registered email, name, Indian mobile number and consent. Razorpay payment is confirmed against the provider before the order is marked paid. Resend queues one confirmation for a captured payment and one completion email when the admin first marks the order completed.

See [production setup](docs/production-setup.md) for the remaining account configuration and launch checks. The running storefront uses Supabase; obsolete Firebase runtime code and setup commands have been removed.

## Verification

```sh
npm run typecheck
npm run build
node --test --import tsx tests/*.test.ts
```

Payment, authentication, image upload and email delivery need a browser smoke test before launch. No live payment should be used until the production setup checks are complete.
