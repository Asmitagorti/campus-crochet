# MASTER DESIGN BRIEF — CAMPUS CROCHET 🧶

Design a complete **desktop-first web application UI/UX** for a handmade crochet brand called **Campus Crochet**.

This is a **student-run handmade crochet marketplace** created by a student from **Aditya educational institutions, Surampalem**.

The website should feel **warm, trustworthy, simple, and premium**, not flashy or overly artistic.

The design should look like a real product that students would trust enough to place an online payment.

---

# Brand identity

### Core message

**“Handmade pieces, stitched with love by a student.”**

Every product is:

* crocheted by hand,
* made using **locally sourced yarn**,
* produced only after an order is placed,
* and carefully checked before handover.

This is a passion project, not a mass-production business.

---

# Tone

The UI should feel:

* welcoming,
* honest,
* respectful,
* personal,
* calm,
* and slightly cozy.

Avoid:

* excessive gradients,
* glassmorphism,
* neon colors,
* oversized animations,
* and anything that looks like a generic startup template.

Think:

* Pinterest,
* a cozy artisan café,
* a handmade notebook,
* a small boutique craft store,
* and a student creator with excellent taste.

---

# Color palette

Use soft yarn-inspired colors:

* Cream — #F7F3EC
* Warm White — #FFFDF8
* Sage Green — #A8B8A0
* Dusty Rose — #D8A7A7
* Soft Lavender — #B7A7D8
* Muted Terracotta — #C97B63
* Warm Brown — #8B6B5C

Use cream/warm white as the primary background.

---

# Typography

Use:

* Elegant serif for headings
* Clean sans-serif for body text
* Subtle handwritten accent font for small notes and labels

Typography should prioritize readability.

---

# Yarn visual theme

Yarn is the main material and should appear throughout the interface as subtle illustrations.

Include:

* small yarn ball drawings,
* stitched line dividers,
* thread-like connectors between sections,
* tiny crochet flower doodles,
* and fabric-inspired decorative curves.

These should be subtle accents, not large distracting graphics.

---

# IMPORTANT TRUST SECTION

Create a prominent section titled:

## “Every piece is handmade — and that makes it unique.”

Explain that:

* slight variations in stitch tension, flower shape, or placement are natural,
* no two handmade pieces will be perfectly identical,
* these tiny differences are a sign of genuine craftsmanship,
* and they make each order uniquely yours.

Also include a clear guarantee:

## “85% similarity guarantee”

> “We guarantee that your final product will be at least **85% visually similar** to the product shown in the listing photos.”

Add a reassuring note:

> “Many people worry about receiving a product that looks nothing like the photos. Every order is made with the listing images as the reference, and we do our best to recreate the same colors, structure, and overall look.”

This section should feel reassuring and trustworthy.

---

# ORDERING POLICY (show clearly)

Create a clean card section called **Before you order** with icons.

### Eligibility

Orders are accepted **only from students of Aditya educational institutions in Surampalem**.

Include a college dropdown:

* ACET
* AEC
* Aditya Degree College
* Aditya Pharmacy College
* Other Aditya institutions

### Campus pickup

* No shipping is available.
* No delivery charges.
* The student must meet the creator at a common pickup point on campus.

### Processing time

* 3–5 working days
* Mention that exam periods may slightly affect timelines.

### Payment

* Full payment must be made online through **Razorpay** before production begins.
* Cash payments are not accepted.

### Refunds

* No refund policy.
* Since each product is made specifically for the customer, orders cannot be cancelled once production starts.

Make these policies extremely clear and easy to read.

---

# DESIGN THESE SCREENS

Use **1440px desktop frames** with a **12-column grid** and **96px vertical spacing** between major sections.

==================================================

1. HOMEPAGE
   ==================================================

### Hero (100vh)

* Large headline: “Handmade pieces, stitched with love.”
* Supporting text explaining local yarn and student-made products.
* Buttons:

  * Explore Collection
  * Custom Order
* Small handwritten note:

  * “Made after you order • 3–5 working days”
* Large crochet product image on the right.
* Decorative yarn thread flowing across the hero section.

### Trust strip

Show 4 items:

* Handmade by a student
* Local yarn
* 85% similarity guarantee
* Campus pickup only

### Featured collection

Show only 3 products:

* Daisy Scrunchie
* Flower Keychain
* Pastel Phone Charm

Large cards, soft shadows, rounded corners (24px), generous padding.

### Our story

Split layout with image and text.

Mention:

> “Built by a student who never stopped creating with their hands.”

### Handmade process

4-step horizontal timeline:

1. Choose a design
2. Pay securely online
3. I crochet your order
4. Meet on campus & collect it

Use yarn-themed icons.

### Past creations preview

Show 4 real completed-order cards with badges:

* Handmade
* Completed
* Real order

Example caption:

> “Sage Daisy Scrunchie • Made for an ACET student • Aug 2026”

### Custom order CTA

Large warm banner with button: “Request a Custom Piece”.

### Footer

Minimal and trustworthy.

---

==================================================
2. PRODUCT CATALOG PAGE
=======================

* Sticky navbar
* Search bar
* Category filter chips
* 3-column responsive grid
* Equal card heights
* Consistent 4:5 image ratio
* Quick add-to-cart hover button
* “Handmade” badge on every product card

---

==================================================
3. PRODUCT DETAIL PAGE
======================

Layout:

* Large image gallery on the left
* Product information on the right

Include:

* Product title
* Price
* Color selector
* Quantity selector
* Processing time (3–5 working days)
* Add to Cart
* Buy Now
* Care instructions accordion
* Handmade uniqueness note
* 85% similarity guarantee card

Add a section:

## “See previous handmade versions”

Show 3–4 real completed versions of the same product in different colors.

---

==================================================
4. CUSTOMER DASHBOARD
=====================

Create a welcoming dashboard for students.

Sections:

* Active orders
* Order status timeline
* Payment status
* Pickup instructions
* Previous orders
* Favorite products (future)

Use a progress tracker:

* Payment received
* Yarn selected
* Crocheting
* Quality check
* Ready for pickup
* Completed

---

==================================================
5. ADMIN DASHBOARD
==================

The admin experience is extremely important.

Use a left sidebar:

* Dashboard
* Products
* Orders
* Past Creations
* Customers
* Analytics
* Settings

Top header:

* Search
* Notifications
* Admin profile
* Quick Add Product button

Dashboard cards:

* Total products
* Pending orders
* Orders in progress
* Revenue this month

Recent orders table with quick status actions.

---

==================================================
6. ADD / EDIT PRODUCT PAGE
==========================

This page should allow adding a product in **under 2 minutes**.

Include:

* Drag-and-drop image upload
* Live image preview
* Recommended image ratio (4:5)
* Product name
* Short description
* Full description
* Price
* Category dropdown
* Color checkboxes
* Processing time dropdown
* Active toggle
* Featured toggle
* Publish button

Add automatic formatting notes:

* images auto-crop,
* thumbnails auto-generate,
* product cards stay aligned automatically.

---

==================================================
7. PAST CREATIONS ARCHIVE
=========================

Create a dedicated admin page showing all completed handmade products.

Display:

* Final product photos
* Original product reference image
* College
* Completion date
* Colors used
* Similarity score (85–100%)
* Public/private toggle

Add a side-by-side comparison:

### Listing Photo vs Final Handmade Photo

This helps maintain quality consistency.

Include a button:

## “Add completed order to public gallery”

---

==================================================
8. RAZORPAY PAYMENT SCREEN
==========================

Design a **clean, official-looking payment card**.

Important:

* Use a real Razorpay placeholder area.
* Keep the UI minimal.
* Avoid decorative effects around the payment form.
* Make it feel secure and familiar.

Add a note:

> “Payments are processed securely through Razorpay. Campus Crochet does not store your card or UPI details.”

---

# MICRO-INTERACTIONS

Use subtle animations only:

* yarn thread gently sways,
* buttons lift slightly on hover,
* cards fade in softly,
* tiny yarn sparkle when an item is added to cart.

### Successful order animation

Show a small yarn ball rolling across the screen and a crochet flower appearing.

Message:

## “Your handmade order has been added to my crochet queue! 🧶💛”

Subtext:

> “I’ll start working on it soon and it should be ready in 3–5 working days.”

Keep it delightful but not childish.

---

# SPACING RULES

Use generous whitespace:

* 96px between major sections
* 64px between heading and content
* 32px between cards
* 24px inside cards
* Max content width: 1200px

The site should feel **open and breathable**, never cramped.

---

# FINAL GOAL

The final design should make a student think:

> “This feels like a real person is making this for me, and I can trust them.”

Prioritize:

* trust,
* clarity,
* emotional warmth,
* handmade authenticity,
* and ease of use for both customers and the admin.

The design should be beautiful enough to feel special, but simple enough to feel completely trustworthy.
