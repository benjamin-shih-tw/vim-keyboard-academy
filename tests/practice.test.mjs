import assert from "node:assert/strict";
import test from "node:test";
import {
  advancePracticeIndex,
  keyboardEventToken,
  normalizePracticeCommand,
  operationAnimation,
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

test("maps mode commands to visible editor transitions", () => {
  assert.deepEqual(operationAnimation("i"), {
    effect: "insert",
    mode: "INSERT",
    label: "進入 INSERT 模式",
  });
  assert.deepEqual(operationAnimation("Esc"), {
    effect: "normal",
    mode: "NORMAL",
    label: "回到 NORMAL 模式",
  });
  assert.deepEqual(operationAnimation("v"), {
    effect: "visual",
    mode: "VISUAL",
    label: "開始選取文字",
  });
});

test("maps editing, movement and judge commands to distinct animations", () => {
  assert.equal(operationAnimation("j").effect, "move-down");
  assert.equal(operationAnimation("dd").effect, "delete");
  assert.equal(operationAnimation(":w").effect, "command");
  assert.equal(operationAnimation("\\r", true).effect, "run");
});
