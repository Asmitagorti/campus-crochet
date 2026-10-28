# Supabase Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the 15 current Campus Crochet media assets from Cloudinary-backed URLs to the existing public Supabase Storage bucket and use Supabase for future admin uploads.

**Architecture:** Upload the local original files to versioned, content-addressed Storage paths. Verify public reads before replacing the URL manifest and the product, Journey, and hero references in Supabase. Change admin upload and URL validation to the same bucket. Retain Cloudinary assets as a rollback source.

**Tech Stack:** Next.js 16, Supabase JS Storage, TypeScript, Node 24.

**Spec:** User's 2026-10-27 request to move images only to Supabase Storage.

## Global Constraints

- Leave Firebase and Supabase customer, order, payment and message records alone.
- Keep product photos public; existing `product_images` bucket is public.
- Upload and verify before replacing active image URLs.
- Do not delete old Cloudinary images.

## Review Focus

- All 15 manifest assets and every live Cloudinary reference move to reachable Supabase URLs.
- Unrelated Supabase image rows stay unchanged.
- Only an authenticated admin can upload new photos.
- Invalid image URLs, other buckets and other Supabase projects are rejected.
- The image content remains the original local asset, under the bucket's size limit.

---

### Task 1: Validate new image URLs

**Files:** `tests/image-url.test.ts`, `lib/image-url.ts`.

- [x] Write the failing validator test.
- [x] Allow only public `product_images` URLs on this Supabase project.
- [x] Run the test and typecheck.

### Task 2: Move media and active references

**Files:** `scripts/migrate-images-to-supabase.mjs`, `lib/media-map.json` and Supabase Storage/database records.

- [x] Upload 15 local originals with content-addressed paths.
- [x] Verify public reads and update exact known Cloudinary references.
- [x] Repeat the migration to prove it is idempotent; check remaining Cloudinary reference count is zero.

### Task 3: Future uploads and documentation

**Files:** `app/api/admin/upload/route.ts`, `proxy.ts`, admin copy, `.env.example`, `README.md`, `docs/production-setup.md`, `app/privacy/page.tsx`.

- [x] Route future admin photo uploads to Supabase Storage.
- [x] Update CSP and customer/admin copy.
- [x] Run tests, typecheck, production build and page checks.
