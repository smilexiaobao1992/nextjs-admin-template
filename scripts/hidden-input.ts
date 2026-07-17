export type HiddenInputResult = {
  value: string;
  action: "continue" | "submit" | "cancel";
};

export function consumeHiddenInput(initialValue: string, chunk: string): HiddenInputResult {
  let value = initialValue;

  for (const character of chunk) {
    if (character === "\u0003") {
      return { value, action: "cancel" };
    }

    if (character === "\r" || character === "\n") {
      return { value, action: "submit" };
    }

    if (character === "\u007f") {
      value = value.slice(0, -1);
      continue;
    }

    if (/^[\x20-\x7E]$/.test(character)) {
      value += character;
    }
  }

  return { value, action: "continue" };
}
