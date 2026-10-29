# Campus Crochet

Campus Crochet is a handmade crochet shop built with Next.js. This `main` branch contains the earlier Firebase storefront. The **poll-only site** is on [`codex/poll-mode`](https://github.com/Asmitagorti/campus-crochet/tree/codex/poll-mode); use that branch and its README when preparing the poll release. The poll code has not been merged into `main`.

## What is in `main`

The storefront uses Firebase Google sign-in and Firestore for accounts, products, orders and site content. Product images are hosted on Cloudinary. Razorpay handles INR checkout. The private `/studio` area manages products, stock, orders, messages and published content.

| Page | Purpose |
| --- | --- |
| `/shop` and `/products/[slug]` | Browse products, photos, prices and availability. |
| `/account` | Sign in with Google and view saved items and orders. |
| `/checkout` | Place an order and pay through Razorpay. |
| `/about`, `/journey` and `/contact` | Read about the studio and send an enquiry. |
| `/studio` | Manage the shop as the designated administrator. |

## Run locally

Use Node.js 24. Copy `.env.example` to `.env.local` and fill in the required credentials. Keep `.env.local` private.

```sh
npm ci
npm run dev
```

`npm run build` creates a production build; `npm start` serves it. `npm run bootstrap` adds missing starter products and content without resetting existing stock. Run it only after configuring the intended Firebase project.

## Check this branch

```sh
npm run check:firebase-runtime
npm run typecheck
npm run build
```

See [production setup](docs/production-setup.md) for Firebase rules, provider credentials, Razorpay testing and launch checks. This branch is **not** the poll release and should not be deployed as the poll site.
