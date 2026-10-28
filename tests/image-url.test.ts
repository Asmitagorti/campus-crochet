import assert from "node:assert/strict";
import test from "node:test";
import { validImage } from "../lib/image-url";

test("only public product images from this Supabase project are accepted", () => {
  const previous = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  try {
    assert.equal(validImage("https://example.supabase.co/storage/v1/object/public/product_images/catalog/bunny.png"), true);
    assert.equal(validImage("https://example.supabase.co/storage/v1/object/public/other/bunny.png"), false);
    assert.equal(validImage("https://other.supabase.co/storage/v1/object/public/product_images/catalog/bunny.png"), false);
    assert.equal(validImage("https://res.cloudinary.com/old/image/upload/bunny.png"), false);
    assert.equal(validImage("https://example.supabase.co/storage/v1/object/public/product_images/../other/x.png"), false);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previous;
  }
});
