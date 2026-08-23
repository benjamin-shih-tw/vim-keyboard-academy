import assert from "node:assert/strict";
import test from "node:test";
import {
  advancePracticeIndex,
  keyboardEventToken,
  normalizePracticeCommand,
  practiceMatch,
} from "../app/practice.ts";

test("cycles through every lesson operation forever", () => {
  assert.equal(advancePracticeIndex(0, 3), 1);
  assert.equal(advancePracticeIndex(1, 3), 2);
  assert.equal(advancePracticeIndex(2, 3), 0);
  assert.equal(advancePracticeIndex(0, 1), 0);
});

test("accepts Escape as a practice key instead of always closing practice", () => {
  assert.equal(keyboardEventToken({ key: "Escape" }), "Esc");
});

test("normalizes snippet Tab and special keys", () => {
  assert.equal(normalizePracticeCommand("cp<Tab>"), "cp⇥");
  assert.equal(keyboardEventToken({ key: "Tab" }), "⇥");
  assert.equal(keyboardEventToken({ key: "r", ctrlKey: true }), "Ctrl-r");
});

test("reports pending, success and error input states", () => {
  assert.equal(practiceMatch("c", "ciw"), "idle");
  assert.equal(practiceMatch("ciw", "ciw"), "good");
  assert.equal(practiceMatch("cx", "ciw"), "bad");
});
