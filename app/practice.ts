export type PracticeState = "idle" | "good" | "bad";

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
