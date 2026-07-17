import { describe, expect, it } from "vitest";
import { consumeHiddenInput } from "./hidden-input";

describe("hidden terminal input", () => {
  it("handles a password and carriage return delivered in one chunk", () => {
    expect(consumeHiddenInput("", "AdminTemplate2026\r")).toEqual({
      value: "AdminTemplate2026",
      action: "submit",
    });
  });

  it("handles backspace and cancellation", () => {
    expect(consumeHiddenInput("abc", "\u007f1")).toEqual({ value: "ab1", action: "continue" });
    expect(consumeHiddenInput("secret", "\u0003")).toEqual({ value: "secret", action: "cancel" });
  });
});
