# Campus Crochet poll mode design

## Intent

Use the existing Campus Crochet website to learn which crochet designs visitors want before selling them. The owner expects to run a new poll roughly every two months, with dates chosen manually. The completed Supabase/Razorpay storefront must remain recoverable and available through an admin switch.

## Decisions from the owner

- One website and one deployment, with a switch inside the existing password-protected admin dashboard.
- Each poll has its own uploaded design photos and short names; the current sellable product catalogue stays separate.
- A visitor may choose several designs. Browsing is open to everyone; submitting or changing a ballot requires the existing Google sign-in. One account has one editable ballot per round.
- Visitors see live totals, and may return to see them again. The admin sees full results.
- The owner manually opens, pauses, closes and creates poll rounds rather than scheduling automatic transitions.
- The admin dashboard shows visits and unique browsers by hour, day and week, plus estimated time spent on the site.

## Visitor experience

In poll mode, keep the site's branding, home story, about, journey, contact, care and theme. Replace shopping calls to action with voting calls to action. `/vote` displays the active round's separate design cards in the site's existing visual style. A visitor can preview images, select multiple designs, sign in with Google at submission, and save or update their ballot until the round closes. The page shows public vote counts and total voters; returning signed-in voters can see their selections and current results. When no poll is open, show a clear coming-soon state.

In poll mode, hide bag, prices, stock and checkout controls from visitor navigation. `/shop`, `/products/*`, and `/checkout` lead visitors to the vote experience or a no-purchase notice. New order creation is disabled at the server and database boundaries. Existing payment verification/reconciliation remains available so an order begun before a switch can settle safely. In shop mode, the existing storefront remains as captured in Git commit `c8e3554` on branch `codex/full-storefront-snapshot-2026-10-28`.

## Admin experience

Add a Polls section to `/admin` using its existing Google identity, role and separate password checks. The owner can create a draft round; upload and arrange option photos, short names and optional descriptions; preview; open; pause by switching to shop; resume; and close. A draft must contain at least two options before opening. Once a round has votes, its candidate set is frozen so historical results remain understandable. Closing preserves results and makes a fresh round possible. The mode switch is immediate for new requests and requires no redeployment.

## Data and security

Add Supabase tables for a singleton site mode, poll rounds, options, ballots and ballot selections. Store poll photos in Supabase Storage under a separate `poll/` path, uploaded through the password-protected server route. Existing product rows, order rows and payment configuration are untouched. Server routes validate all input. A database transaction replaces a signed-in user's selections atomically, verifies all selected options belong to the open round, and prevents duplicate votes. A partial unique constraint permits one open round; ballots remain available as aggregate history after closure. Rate limit public and voting requests. Keep direct browser table writes revoked. Do not return voter identities in public results.

For analytics, use a first-party, signed, anonymous browser cookie. Record thirty-second presence and bounded active seconds only when a page is visible and focused; do not store IP addresses, user agents, Google IDs, or page content in analytics records. The admin dashboard reports unique browser identifiers and total active tab time for selected hour/day/week windows, grouped in Asia/Kolkata time. These are estimates: cookies can be cleared, browsers shared, bots can visit, and background/offline time is excluded. Provide a visible analytics opt-out that deletes the browser identifier and stops future measurements. Retain raw data for 180 days and update the privacy page before poll mode goes live. The analytics endpoint accepts no cross-origin writes and is rate-limited.

## Failure behavior and rollout

Mode reads for payment must fail closed. A broken or missing poll configuration never enables payment by accident. Existing pending payment callbacks can still finish. A poll has no candidate images or rates automatically guessed. Run an additive Supabase migration, which starts the live site in poll holding mode with checkout closed. The owner uploads at least two options and manually opens the round. The shop returns only when the owner explicitly switches it on.

## Approaches considered

- **One website with an admin switch — chosen.** Fast to change modes, preserves the existing domain and design, and keeps one admin dashboard and visitor history. It needs careful server-side checkout gating.
- Separate poll website. Isolates voting but splits visitors across URLs and requires another deployment and duplicated design/content upkeep.
- Redeploy a poll-only branch each cycle. Preserves the storefront in Git but makes every switch a code deployment and increases the chance of running the wrong version.

## Builder's calls

The owner has not asked for automatic poll dates, voter emails, or public voter identity; none are included. Public result counts appear for all visitors. The owner can view counts at any time. Analytics are first-party and approximate, with no third-party analytics account or paid plan.
