import assert from "node:assert/strict";
import test from "node:test";
import { separateMeasurements } from "../lib/product-details";

test("admin measurements appear once above purchase options, not in specifications", () => {
  const result = separateMeasurements([
    ["Includes", "One crochet octopus"],
    [" measurements ", "Approx. 12 cm tall"],
    ["Dimensions", "8 cm wide"],
    ["Finish", "Hand crocheted"],
  ]);
  assert.deepEqual(result.measurements, ["Approx. 12 cm tall", "8 cm wide"]);
  assert.deepEqual(result.specifications, [
    ["Includes", "One crochet octopus"], ["Finish", "Hand crocheted"],
  ]);
});

test("other specifications stay put when no measurements have been entered", () => {
  const result = separateMeasurements([["Includes", "One"], ["Size", "  "]]);
  assert.deepEqual(result.measurements, []);
  assert.deepEqual(result.specifications, [["Includes", "One"]]);
});
