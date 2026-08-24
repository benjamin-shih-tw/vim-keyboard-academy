import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createVimState, runVimCommand } from "../app/vim-simulator.ts";
import { lessons } from "../app/tutorial-data.ts";

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

function renderedState(state) {
  return JSON.stringify({
    lines: state.lines,
    cursor: state.cursor,
    mode: state.mode,
    selection: state.selection,
    judge: state.judge,
    workspace: state.workspace,
    saved: state.saved,
    closed: state.closed,
    visual: state.visual,
  });
}

test("every course operation produces a substantive rendered Vim change", () => {
  const unchanged = [];
  const visualKinds = new Set();
  for (const lesson of lessons) {
    for (const command of lesson.keys) {
      const initial = createVimState(lesson.before, lesson.cursorBefore, "NORMAL", lesson.panel);
      const result = runVimCommand(initial, command, lesson);
      if (result.visual) visualKinds.add(result.visual.kind);
      if (renderedState(result) === renderedState(initial)) unchanged.push(`${lesson.id}:${command}`);
    }
  }
  assert.deepEqual(unchanged, []);

  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  for (const kind of visualKinds) {
    assert.ok(css.includes(`.visual-${kind}`) || page.includes(`visual.kind === "${kind}"`), `${kind} has no rendered animation`);
  }
});
