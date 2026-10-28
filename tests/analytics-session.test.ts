import { test } from "node:test";
import { strict as assert } from "node:assert";
import { analyticsStopped, stopAnalyticsAndDrain, trackAnalyticsRequest } from "../components/analytics-session";

test("opt-out waits for an outstanding visit write before deleting", async () => {
  let finish!: () => void;
  const request = trackAnalyticsRequest(new Promise<void>((resolve) => { finish = resolve; }));
  const stopped = stopAnalyticsAndDrain();
  assert.equal(analyticsStopped(), true);
  let drained = false;
  void stopped.then(() => { drained = true; });
  await Promise.resolve();
  assert.equal(drained, false);
  finish();
  await request;
  await stopped;
  assert.equal(drained, true);
});
