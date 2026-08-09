import { describe, expect, it } from "vitest";
import { hasSystemAdminRole, parseRoleKeys, serializeRoleKeys } from "./role-keys";

describe("role key serialization", () => {
  it("parses and deduplicates Better Auth comma-separated roles", () => {
    expect(parseRoleKeys("member,ops,member")).toEqual(["member", "ops"]);
  });

  it("serializes multiple roles and falls back to member", () => {
    expect(serializeRoleKeys(["member", "ops", "member"])).toBe("member,ops");
    expect(serializeRoleKeys([])).toBe("member");
  });

  it("recognizes admin within a multi-role value", () => {
    expect(hasSystemAdminRole("ops,admin")).toBe(true);
    expect(hasSystemAdminRole("ops,member")).toBe(false);
  });
});
