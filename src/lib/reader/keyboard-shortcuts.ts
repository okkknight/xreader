export type ReaderShortcut = "toggle" | "previous" | "next";

type KeyInput = { key: string; targetTagName?: string; isContentEditable?: boolean; altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean };

export function readerShortcutForKey({ key, targetTagName, isContentEditable, altKey, ctrlKey, metaKey, shiftKey }: KeyInput): ReaderShortcut | undefined {
  if (altKey || ctrlKey || metaKey || shiftKey || isContentEditable || ["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"].includes(targetTagName ?? "")) return undefined;
  if (key === " ") return "toggle";
  if (key === "ArrowLeft") return "previous";
  if (key === "ArrowRight") return "next";
  return undefined;
}
