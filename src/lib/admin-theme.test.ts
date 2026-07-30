import { describe, expect, it } from "vitest";
import { parseAdminTheme } from "./admin-theme";

describe("admin theme", () => {
  it("accepts the two supported themes", () => {
    expect(parseAdminTheme("graphite")).toBe("graphite");
    expect(parseAdminTheme("indigo")).toBe("indigo");
  });

  it("falls back to indigo for missing or unknown values", () => {
    expect(parseAdminTheme(undefined)).toBe("indigo");
    expect(parseAdminTheme("future-theme")).toBe("indigo");
  });
});
