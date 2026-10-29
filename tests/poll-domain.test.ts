import assert from "node:assert/strict";
import test from "node:test";
import { parseSiteMode, assertShoppingEnabled, parseBallotOptionIds, publicPollResults, withdrawnVoteCount, visibleDraftSelections, pollImageUrls, movePollImage } from "../lib/poll-domain";

test("unknown mode never permits a new purchase", () => {
  assert.equal(parseSiteMode("shop"), "shop");
  assert.equal(parseSiteMode("poll"), "poll");
  assert.throws(() => parseSiteMode("unknown"), /mode/i);
  assert.throws(() => assertShoppingEnabled("poll"), /unavailable/i);
  assert.throws(() => assertShoppingEnabled("unknown"), /unavailable/i);
});

test("one ballot accepts several distinct option IDs", () => {
  const first = "11111111-1111-4111-8111-111111111111";
  const second = "22222222-2222-4222-8222-222222222222";
  assert.deepEqual(parseBallotOptionIds([first, second]), [first, second]);
  assert.throws(() => parseBallotOptionIds([]), /choose/i);
  assert.throws(() => parseBallotOptionIds([first, first]), /once/i);
  assert.throws(() => parseBallotOptionIds(["not-a-uuid"]), /design/i);
});

test("hidden poll items stay in recorded ballots but disappear from public totals", () => {
  const visible = "11111111-1111-4111-8111-111111111111";
  const hidden = "22222222-2222-4222-8222-222222222222";
  const results = { totalVoters: 3, options: [{ id: visible, votes: 2 }, { id: hidden, votes: 1 }] };
  assert.deepEqual(publicPollResults(results, [visible]), {
    totalVoters: 3, options: [{ id: visible, votes: 2 }],
  });
  assert.equal(withdrawnVoteCount([visible, hidden], [visible]), 1);
  assert.deepEqual(visibleDraftSelections([visible, hidden], [visible]), [visible]);
});

test("older poll items still show their original picture", () => {
  const original = "https://example.supabase.co/storage/v1/object/public/product_images/poll/original.jpg";
  const extra = "https://example.supabase.co/storage/v1/object/public/product_images/poll/extra.jpg";
  assert.deepEqual(pollImageUrls(original, null), [original]);
  assert.deepEqual(pollImageUrls(original, []), [original]);
  assert.deepEqual(pollImageUrls(original, [original, extra]), [original, extra]);
});

test("moving a poll picture changes its saved display order without changing the original list", () => {
  const pictures = ["cover", "blue", "pink"];
  assert.deepEqual(movePollImage(pictures, 2, 0), ["pink", "cover", "blue"]);
  assert.deepEqual(pictures, ["cover", "blue", "pink"]);
  assert.deepEqual(movePollImage(pictures, 0, -1), pictures);
  assert.deepEqual(movePollImage(pictures, 2, 3), pictures);
});
