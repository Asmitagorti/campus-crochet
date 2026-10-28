import assert from "node:assert/strict";
import test from "node:test";
import { parsePollRoundDraft, parsePollOptionDraft } from "../lib/poll-admin-validation";

test("draft rounds require a useful title", () => {
  assert.deepEqual(parsePollRoundDraft({ title: "November favourites", description: "Pick what you love." }),
    { title: "November favourites", description: "Pick what you love." });
  assert.throws(() => parsePollRoundDraft({ title: "X" }), /title/i);
});

test("poll options accept only this project's separate poll uploads", () => {
  const previous = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  try {
    const imageUrl = "https://example.supabase.co/storage/v1/object/public/product_images/poll/photo.jpg";
    assert.deepEqual(parsePollOptionDraft({ title: "Little owl", description: "Blue yarn", imageUrl, position: 2 }),
      { title: "Little owl", description: "Blue yarn", imageUrl, position: 2 });
    assert.throws(() => parsePollOptionDraft({ title: "Little owl", imageUrl: imageUrl.replace("/poll/", "/admin/"), position: 2 }), /poll photo/i);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previous;
  }
});
