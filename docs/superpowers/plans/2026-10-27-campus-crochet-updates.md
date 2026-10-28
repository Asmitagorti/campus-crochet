# Campus Crochet Updates Implementation Plan

**Goal:** Extend the existing storefront with account isolation, delivery checkout, order tracking and emails, support information, and an order focused admin dashboard.

**Architecture:** Keep Next.js App Router, Razorpay, and the current product and studio UI. Migrate account and application data from Firebase to the user's existing Supabase project. Server routes remain authoritative for users, prices, orders, and admin transitions. Supabase notification jobs and Resend idempotency keys coordinate the two lifecycle emails.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase Auth/Postgres, Razorpay, Resend HTTP API, Cloudinary.

**Spec:** User supplied Campus Crochet website update brief.

## Tasks

- [ ] Validate name, ten digit mobile, address selection, full address, and server computed delivery total. Reject outside delivery payment while its destination-specific charge is unset.
- [ ] Adapt the existing Supabase tables and stored functions without deleting test data; seed the existing storefront catalogue and move site content and Journey.
- [ ] Move cart and favorites to account scoped preferences, gate add/save behind sign-in, clear personal UI on sign-out, and preserve existing account favorites.
- [ ] Add paid order confirmation and completion outbox records, Resend sender, retry handling, and customer progress views.
- [ ] Improve the existing admin workspace under `/admin` with order search, filters, details, stage controls, and verified paid summaries; retain product tools.
- [ ] Replace public personal phone links with support email, update contact flow, footer, policies and care guide.
- [ ] Run focused tests, typecheck, build and available security checks; document configuration and limitations.
