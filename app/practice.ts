export type PracticeState = "idle" | "good" | "bad";
export type VimMode = "NORMAL" | "INSERT" | "VISUAL" | "COMMAND";
export type OperationEffect =
  | "insert"
  | "normal"
  | "visual"
  | "move-left"
  | "move-right"
  | "move-up"
  | "move-down"
  | "jump"
  | "delete"
  | "change"
  | "yank"
  | "paste"
  | "undo"
  | "command"
  | "judge"
  | "run"
  | "action";

export type OperationAnimation = {
  effect: OperationEffect;
  mode: VimMode;
  label: string;
};

type PracticeKeyEvent = {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
};

export function normalizePracticeCommand(command: string) {
  return command
    .replaceAll("<Tab>", "⇥")
    .replaceAll("Enter", "↵")
    .replaceAll("Escape", "Esc")
    .replace(/\s+(?=(?:Ctrl|Alt|Cmd)-)/g, "");
}

export function keyboardEventToken(event: PracticeKeyEvent) {
  if (event.key === "Escape") return "Esc";
  if (event.key === "Tab") return "⇥";
  if (event.key === "Enter") return "↵";
  if ((event.ctrlKey || event.metaKey) && event.key.length === 1) return `Ctrl-${event.key.toLowerCase()}`;
  if (event.altKey && event.key.length === 1) return `Alt-${event.key.toLowerCase()}`;
  return event.key.length === 1 ? event.key : "";
}

export function practiceMatch(input: string, command: string): PracticeState {
  const expected = normalizePracticeCommand(command);
  if (input === expected) return "good";
  return expected.startsWith(input) ? "idle" : "bad";
}

export function advancePracticeIndex(index: number, operationCount: number) {
  return operationCount > 0 ? (index + 1) % operationCount : 0;
}

export function operationAnimation(command: string, judgeContext = false): OperationAnimation {
  const key = command.trim();

  if (key === "Esc" || key === "Escape") return { effect: "normal", mode: "NORMAL", label: "回到 NORMAL 模式" };
  if (key === "v" || key === "V" || key === "Ctrl-v") return { effect: "visual", mode: "VISUAL", label: "開始選取文字" };
  if (judgeContext && (key === "r" || key === "R" || key === "\\r" || key === "\\a")) {
    return { effect: "run", mode: "NORMAL", label: key === "R" || key === "\\a" ? "執行全部測資" : "執行目前測資" };
  }
  if (judgeContext || key === "\\j") return { effect: "judge", mode: "NORMAL", label: "更新 Judge 面板" };
  if (key.startsWith(":")) return { effect: "command", mode: "COMMAND", label: `執行 ${key} 指令` };
  if (key.startsWith("/") || key.startsWith("?")) return { effect: "command", mode: "COMMAND", label: "搜尋並跳到結果" };
  if (key === "h") return { effect: "move-left", mode: "NORMAL", label: "游標向左移動" };
  if (key === "j") return { effect: "move-down", mode: "NORMAL", label: "游標向下移動" };
  if (key === "k") return { effect: "move-up", mode: "NORMAL", label: "游標向上移動" };
  if (key === "l") return { effect: "move-right", mode: "NORMAL", label: "游標向右移動" };
  if (/^(w|W|e|E|\$)$/.test(key)) return { effect: "move-right", mode: "NORMAL", label: "游標向前跳躍" };
  if (/^(b|B|0|\^)$/.test(key)) return { effect: "move-left", mode: "NORMAL", label: "游標向後跳躍" };
  if (/^(gg|G|n|N|%|\{|\})$/.test(key)) return { effect: "jump", mode: "NORMAL", label: "游標跳到目標" };
  if (/^(dd|D|x|X|d.+)$/.test(key)) return { effect: "delete", mode: "NORMAL", label: "刪除文字" };
  if (/^(yy|Y|y.+)$/.test(key)) return { effect: "yank", mode: "NORMAL", label: "複製文字" };
  if (/^(p|P)$/.test(key)) return { effect: "paste", mode: "NORMAL", label: "貼上文字" };
  if (/^(u|Ctrl-r|\.)$/.test(key)) return { effect: "undo", mode: "NORMAL", label: key === "u" ? "復原上一步" : "重做操作" };
  if (/^(i|a|I|A|o|O)$/.test(key)) return { effect: "insert", mode: "INSERT", label: "進入 INSERT 模式" };
  if (/^(s|S|c.+|r|R|~|gu.+|gU.+|=.+|>.+|<.+)$/.test(key)) return { effect: "change", mode: key === "r" || key === "R" || key === "~" ? "NORMAL" : "INSERT", label: "修改文字" };
  return { effect: "action", mode: "NORMAL", label: "執行 Vim 操作" };
}
