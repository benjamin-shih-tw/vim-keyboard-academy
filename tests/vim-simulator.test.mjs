import assert from "node:assert/strict";
import test from "node:test";
import { createVimState, runVimCommand } from "../app/vim-simulator.ts";

test("mode commands change the real Vim mode", () => {
  const initial = createVimState(["int main() {}"], [1, 5]);
  assert.equal(runVimCommand(initial, "i").mode, "INSERT");
  assert.equal(runVimCommand(initial, "v").mode, "VISUAL");
  assert.equal(runVimCommand({ ...initial, mode: "INSERT" }, "Esc").mode, "NORMAL");
});

test("movement commands change the cursor position", () => {
  const initial = createVimState(["abc", "def"], [1, 2]);
  assert.deepEqual(runVimCommand(initial, "j").cursor, [2, 2]);
  assert.deepEqual(runVimCommand(initial, "h").cursor, [1, 1]);
  assert.deepEqual(runVimCommand(initial, "$").cursor, [1, 3]);
});

test("editing commands mutate the buffer instead of only showing feedback", () => {
  const initial = createVimState(["alpha", "beta", "gamma"], [2, 1]);
  const deleted = runVimCommand(initial, "dd");
  assert.deepEqual(deleted.lines, ["alpha", "gamma"]);
  assert.deepEqual(deleted.clipboard, ["beta"]);
  assert.deepEqual(runVimCommand(createVimState(["abc"], [1, 2]), "x").lines, ["ac"]);
});

test("open line and paste commands create visible buffer changes", () => {
  const initial = createVimState(["one", "two"], [1, 1]);
  const opened = runVimCommand(initial, "o");
  assert.deepEqual(opened.lines, ["one", "", "two"]);
  assert.equal(opened.mode, "INSERT");
  const pasted = runVimCommand({ ...initial, clipboard: ["copy"] }, "p");
  assert.deepEqual(pasted.lines, ["one", "copy", "two"]);
});

test("judge commands add, delete, edit and run actual testcase state", () => {
  const initial = createVimState(["code"], [1, 1], "NORMAL", "judge");
  assert.equal(runVimCommand(initial, "a", { panel: "judge" }).judge?.caseCount, 4);
  assert.equal(runVimCommand(initial, "d", { panel: "judge" }).judge?.caseCount, 2);
  assert.equal(runVimCommand(initial, "i", { panel: "judge" }).judge?.editing, true);
  assert.equal(runVimCommand(initial, "\\r", { panel: "judge" }).judge?.verdict, "Accepted");
  assert.equal(runVimCommand(initial, "q", { panel: "judge" }).judge?.open, false);
});
