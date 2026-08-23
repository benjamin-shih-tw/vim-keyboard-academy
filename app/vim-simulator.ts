import type { Lesson } from "./tutorial-data";

export type SimulatorMode = "NORMAL" | "INSERT" | "VISUAL" | "COMMAND" | "REPLACE";

export type JudgeState = {
  open: boolean;
  caseCount: number;
  activeCase: number;
  editing: boolean;
  help: boolean;
  verdict: "Ready" | "Running" | "Accepted" | "Wrong Answer" | "Compile Error" | "Runtime Error" | "Timeout";
};

export type VimState = {
  lines: string[];
  cursor: [number, number];
  mode: SimulatorMode;
  clipboard: string[];
  message: string;
  saved: boolean;
  closed: boolean;
  selection?: "character" | "line" | "block";
  judge?: JudgeState;
  workspace: { file: string; view: "editor" | "netrw"; splits: number; tabs: number };
};

type CommandContext = Pick<Lesson, "id" | "after" | "panel"> | { panel?: Lesson["panel"]; id?: string; after?: string[] };

function clampCursor(lines: string[], cursor: [number, number]): [number, number] {
  const row = Math.min(Math.max(1, cursor[0]), Math.max(1, lines.length));
  const length = lines[row - 1]?.length ?? 0;
  return [row, Math.min(Math.max(1, cursor[1]), Math.max(1, length))];
}

function currentLine(state: VimState) {
  return state.lines[state.cursor[0] - 1] ?? "";
}

function cloneState(state: VimState): VimState {
  return {
    ...state,
    lines: [...state.lines],
    cursor: [...state.cursor],
    clipboard: [...state.clipboard],
    judge: state.judge ? { ...state.judge } : undefined,
    workspace: { ...state.workspace },
  };
}

function wordRange(line: string, col: number) {
  let start = Math.min(Math.max(0, col - 1), Math.max(0, line.length - 1));
  while (start > 0 && /[\w]/.test(line[start - 1])) start--;
  let end = start;
  while (end < line.length && /[\w]/.test(line[end])) end++;
  return [start, end] as const;
}

export function createVimState(
  lines: string[],
  cursor: [number, number] = [1, 1],
  mode: SimulatorMode = "NORMAL",
  panel?: Lesson["panel"],
): VimState {
  const safeLines = lines.length ? [...lines] : [""];
  return {
    lines: safeLines,
    cursor: clampCursor(safeLines, cursor),
    mode,
    clipboard: [safeLines[Math.max(0, cursor[0] - 1)] ?? ""],
    message: "等待操作",
    saved: false,
    closed: false,
    judge: panel === "judge" ? { open: true, caseCount: 3, activeCase: 1, editing: false, help: false, verdict: "Ready" } : undefined,
    workspace: { file: "solution.cpp", view: "editor", splits: 1, tabs: 1 },
  };
}

function runJudgeCommand(state: VimState, command: string) {
  if (!state.judge) return false;
  const judge = state.judge;
  if (command === "a") {
    judge.caseCount++;
    judge.activeCase = judge.caseCount;
    judge.verdict = "Ready";
    state.message = `已新增 TC ${judge.caseCount}`;
  } else if (command === "d") {
    judge.caseCount = Math.max(1, judge.caseCount - 1);
    judge.activeCase = Math.min(judge.activeCase, judge.caseCount);
    state.message = `已刪除測資，剩下 ${judge.caseCount} 組`;
  } else if (command === "i") {
    judge.editing = true;
    state.mode = "INSERT";
    state.message = `正在編輯 TC ${judge.activeCase} 的 Input / Expected`;
  } else if (["\\r", "\\a", "r", "R"].includes(command)) {
    judge.editing = false;
    judge.verdict = "Accepted";
    state.mode = "NORMAL";
    state.message = command === "\\a" || command === "R" ? `全部 ${judge.caseCount} 組測資 Accepted` : `TC ${judge.activeCase} Accepted`;
  } else if (["Accepted", "Wrong Answer", "Compile Error", "Runtime Error", "Timeout"].includes(command)) {
    judge.verdict = command as JudgeState["verdict"];
    state.message = `Verdict: ${command}`;
  } else if (command === "?") {
    judge.help = true;
    state.message = "已開啟 Judge 快捷鍵說明";
  } else if (command === "q") {
    judge.open = false;
    state.message = "已關閉 Judge 面板";
  } else if (command === "\\j") {
    judge.open = true;
    state.message = "已開啟 CPH Modern Judge";
  } else {
    return false;
  }
  return true;
}

export function runVimCommand(input: VimState, command: string, context: CommandContext = {}): VimState {
  const state = cloneState(input);
  const key = command.trim();

  if (context.panel === "judge") {
    state.judge ??= { open: true, caseCount: 3, activeCase: 1, editing: false, help: false, verdict: "Ready" };
    if (runJudgeCommand(state, key)) return state;
  }

  const lineIndex = state.cursor[0] - 1;
  const line = currentLine(state);
  const colIndex = Math.min(Math.max(0, state.cursor[1] - 1), Math.max(0, line.length));

  if (key === "Esc" || key === "Escape") {
    state.mode = "NORMAL";
    state.selection = undefined;
    state.message = "NORMAL 模式";
  } else if (key === "i") {
    state.mode = "INSERT";
    state.message = "可在游標前輸入文字";
  } else if (key === "a") {
    state.mode = "INSERT";
    state.cursor = [state.cursor[0], Math.min(line.length + 1, state.cursor[1] + 1)];
    state.message = "可在游標後輸入文字";
  } else if (key === "I") {
    state.mode = "INSERT";
    state.cursor = [state.cursor[0], Math.max(1, line.search(/\S|$/) + 1)];
    state.message = "移到行首並進入 INSERT";
  } else if (key === "A") {
    state.mode = "INSERT";
    state.cursor = [state.cursor[0], line.length + 1];
    state.message = "移到行尾並進入 INSERT";
  } else if (key === "o" || key === "O") {
    const insertAt = key === "o" ? lineIndex + 1 : lineIndex;
    state.lines.splice(insertAt, 0, "");
    state.cursor = [insertAt + 1, 1];
    state.mode = "INSERT";
    state.message = key === "o" ? "在下方新增空白行" : "在上方新增空白行";
  } else if (key === "v" || key === "V" || key === "Ctrl-v") {
    state.mode = "VISUAL";
    state.selection = key === "v" ? "character" : key === "V" ? "line" : "block";
    state.message = key === "v" ? "字元選取" : key === "V" ? "整行選取" : "矩形選取";
  } else if (["h", "j", "k", "l"].includes(key)) {
    const [row, col] = state.cursor;
    if (key === "h") state.cursor = [row, col - 1];
    if (key === "l") state.cursor = [row, col + 1];
    if (key === "j") state.cursor = [row + 1, col];
    if (key === "k") state.cursor = [row - 1, col];
    state.cursor = clampCursor(state.lines, state.cursor);
    state.message = `游標移到 ${state.cursor[0]}:${state.cursor[1]}`;
  } else if (key === "0" || key === "^") {
    state.cursor = [state.cursor[0], key === "0" ? 1 : Math.max(1, line.search(/\S|$/) + 1)];
    state.message = key === "0" ? "移到實際行首" : "移到第一個非空白字元";
  } else if (key === "$") {
    state.cursor = [state.cursor[0], Math.max(1, line.length)];
    state.message = "移到行尾";
  } else if (key === "gg" || key === "G" || /^\d+G$/.test(key)) {
    const target = key === "gg" ? 1 : key === "G" ? state.lines.length : Number(key.slice(0, -1));
    state.cursor = clampCursor(state.lines, [target, state.cursor[1]]);
    state.message = `跳到第 ${state.cursor[0]} 行`;
  } else if (["w", "e", "b"].includes(key)) {
    const [start, end] = wordRange(line, state.cursor[1]);
    if (key === "b") state.cursor = [state.cursor[0], Math.max(1, start + 1)];
    else if (key === "e") state.cursor = [state.cursor[0], Math.max(1, end)];
    else {
      const rest = line.slice(Math.max(end, colIndex + 1));
      const next = rest.search(/\w/);
      state.cursor = [state.cursor[0], next < 0 ? Math.max(1, line.length) : Math.max(end, colIndex + 1) + next + 1];
    }
    state.message = `游標跳到 ${state.cursor[0]}:${state.cursor[1]}`;
  } else if (key === "x" || key === "X") {
    const removeAt = key === "x" ? colIndex : Math.max(0, colIndex - 1);
    state.clipboard = [line[removeAt] ?? ""];
    state.lines[lineIndex] = line.slice(0, removeAt) + line.slice(removeAt + 1);
    state.cursor = clampCursor(state.lines, [state.cursor[0], key === "X" ? state.cursor[1] - 1 : state.cursor[1]]);
    state.message = `已刪除字元「${state.clipboard[0]}」`;
  } else if (/^(\d+)?dd$/.test(key)) {
    const count = Number(key.match(/^\d+/)?.[0] ?? 1);
    state.clipboard = state.lines.splice(lineIndex, count);
    if (!state.lines.length) state.lines = [""];
    state.cursor = clampCursor(state.lines, [state.cursor[0], 1]);
    state.message = `已刪除 ${state.clipboard.length} 行`;
  } else if (key === "D") {
    state.clipboard = [line.slice(colIndex)];
    state.lines[lineIndex] = line.slice(0, colIndex);
    state.cursor = clampCursor(state.lines, state.cursor);
    state.message = "已刪除到行尾";
  } else if (/^d(w|e|b|0)$/.test(key) || key === "diw") {
    const [start, end] = wordRange(line, state.cursor[1]);
    const from = key === "db" || key === "d0" ? key === "d0" ? 0 : start : colIndex;
    const to = key === "d0" ? colIndex : Math.max(end, colIndex + 1);
    state.clipboard = [line.slice(from, to)];
    state.lines[lineIndex] = line.slice(0, from) + line.slice(to);
    state.cursor = clampCursor(state.lines, [state.cursor[0], from + 1]);
    state.message = `已刪除「${state.clipboard[0]}」`;
  } else if (/^(s|S|cc|cw|ciw|C|ci.|c.)$/.test(key)) {
    const [start, end] = wordRange(line, state.cursor[1]);
    if (key === "S" || key === "cc") state.lines[lineIndex] = line.match(/^\s*/)?.[0] ?? "";
    else if (key === "C") state.lines[lineIndex] = line.slice(0, colIndex);
    else if (key === "s") state.lines[lineIndex] = line.slice(0, colIndex) + line.slice(colIndex + 1);
    else state.lines[lineIndex] = line.slice(0, start) + line.slice(end);
    state.cursor = clampCursor(state.lines, [state.cursor[0], key === "S" || key === "cc" ? 1 : start + 1]);
    state.mode = "INSERT";
    state.message = "已刪除範圍，等待輸入新文字";
  } else if (key === "r" || key === "R" || key === "~") {
    if (key === "~" && line[colIndex]) {
      const toggled = line[colIndex] === line[colIndex].toUpperCase() ? line[colIndex].toLowerCase() : line[colIndex].toUpperCase();
      state.lines[lineIndex] = line.slice(0, colIndex) + toggled + line.slice(colIndex + 1);
      state.message = `切換為「${toggled}」`;
    } else {
      state.mode = key === "R" ? "REPLACE" : "NORMAL";
      state.message = key === "R" ? "進入連續覆寫模式" : "等待下一個字元來替換";
    }
  } else if (/^g[uU]w$/.test(key)) {
    const [start, end] = wordRange(line, state.cursor[1]);
    const changed = key === "guw" ? line.slice(start, end).toLowerCase() : line.slice(start, end).toUpperCase();
    state.lines[lineIndex] = line.slice(0, start) + changed + line.slice(end);
    state.message = key === "guw" ? "單字已轉為小寫" : "單字已轉為大寫";
  } else if (/^(\d+)?yy$/.test(key) || ["Y", "yw", "yiw", "y$"].includes(key)) {
    const count = Number(key.match(/^\d+/)?.[0] ?? 1);
    state.clipboard = key.endsWith("yy") || key === "Y" ? state.lines.slice(lineIndex, lineIndex + count) : [line.slice(wordRange(line, state.cursor[1])[0], key === "y$" ? line.length : wordRange(line, state.cursor[1])[1])];
    state.message = `已複製 ${state.clipboard.length > 1 ? `${state.clipboard.length} 行` : `「${state.clipboard[0]}」`}`;
  } else if (key === "p" || key === "P") {
    const insertAt = key === "p" ? lineIndex + 1 : lineIndex;
    state.lines.splice(insertAt, 0, ...state.clipboard);
    state.cursor = clampCursor(state.lines, [insertAt + 1, 1]);
    state.message = `已貼上 ${state.clipboard.length} 行`;
  } else if (key === ">>" || key === "<<" || key === "==") {
    state.lines[lineIndex] = key === ">>" ? `    ${line}` : key === "<<" ? line.replace(/^ {1,4}/, "") : `${line.match(/^\s*/)?.[0] ?? ""}${line.trim()}`;
    state.message = key === ">>" ? "向右縮排" : key === "<<" ? "向左縮排" : "已格式化目前行";
  } else if (key === "Ctrl-a" || key === "Ctrl-x") {
    const match = line.slice(colIndex).match(/\d+/) ?? line.match(/\d+/);
    if (match?.index !== undefined) {
      const absolute = line.indexOf(match[0], Math.max(0, colIndex - 1));
      const value = Number(match[0]) + (key === "Ctrl-a" ? 1 : -1);
      state.lines[lineIndex] = line.slice(0, absolute) + value + line.slice(absolute + match[0].length);
      state.cursor = [state.cursor[0], absolute + 1];
      state.message = `數字變成 ${value}`;
    }
  } else if (key.startsWith(":")) {
    state.mode = "COMMAND";
    if (key === ":w") { state.saved = true; state.message = "已寫入 solution.cpp"; }
    else if (key === ":q") { state.closed = true; state.message = "已關閉目前 buffer"; }
    else if (key === ":wq") { state.saved = true; state.closed = true; state.message = "已儲存並離開"; }
    else if (key === ":q!") { state.closed = true; state.message = "已放棄修改並離開"; }
    else if (key === ":bn" || key === ":bp" || key.startsWith(":b ")) { state.workspace.file = key.startsWith(":b ") ? `${key.slice(3)}.cpp` : key === ":bn" ? "template.cpp" : "solution.cpp"; state.message = `切換到 ${state.workspace.file}`; }
    else if (key === ":sp" || key === ":vs") { state.workspace.splits++; state.message = `已建立${key === ":sp" ? "水平" : "垂直"}分割視窗`; }
    else if (key === ":tabnew") { state.workspace.tabs++; state.message = `已建立 Tab ${state.workspace.tabs}`; }
    else if (key === ":tabclose") { state.workspace.tabs = Math.max(1, state.workspace.tabs - 1); state.message = `剩下 ${state.workspace.tabs} 個 Tab`; }
    else if (key === ":ls") state.message = "1 %a solution.cpp    2 h template.cpp";
    else if (/^:%?s\//.test(key)) {
      const parts = key.replace(/^:%?s\//, "").split("/");
      if (parts.length >= 2) {
        const [from, to] = parts;
        const targets = key.startsWith(":%") ? state.lines.map((_, index) => index) : [lineIndex];
        targets.forEach((index) => { state.lines[index] = state.lines[index].split(from).join(to); });
        state.message = `已將 ${from} 取代為 ${to}`;
      }
    } else state.message = `已執行 ${key}`;
  } else if (key === "\\e") {
    state.workspace.view = "netrw";
    state.message = "已開啟檔案總管";
  } else if (key.includes("<Tab>") && context.after?.length) {
    state.lines = [...context.after];
    state.cursor = clampCursor(state.lines, [7, 5]);
    state.mode = "INSERT";
    state.message = `已展開 ${key.replace("<Tab>", "")} 模板`;
  } else if (context.id === "companion" && context.after?.length) {
    state.lines = [...context.after];
    state.cursor = clampCursor(state.lines, [3, 1]);
    state.message = "題目、C++ 檔案與 samples 已匯入";
  } else if (["u", "Ctrl-r", ".", "gg=G", "=%", "=i{", "qa", "q", "@a", "@@", "10@a", "g Ctrl-a"].includes(key) && context.after?.length) {
    state.lines = [...context.after];
    state.cursor = clampCursor(state.lines, input.cursor);
    state.message = `已執行 ${key}，buffer 內容已更新`;
  } else {
    state.message = `已執行 ${key}`;
  }

  state.cursor = clampCursor(state.lines, state.cursor);
  return state;
}
