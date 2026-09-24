import { describe, expect, it } from "vitest";
import {
  canBeDefaultRole,
  isSafeInternalHref,
  isValidMenuNode,
  isValidPermissionKey,
  isValidRoleKey,
} from "./validate";

describe("rbac validation", () => {
  it("accepts resource:action permission keys", () => {
    expect(isValidPermissionKey("users:read")).toBe(true);
    expect(isValidPermissionKey("orders_v2:export")).toBe(true);
    expect(isValidPermissionKey("Users:Read")).toBe(false);
    expect(isValidPermissionKey("users")).toBe(false);
  });

  it("accepts role keys", () => {
    expect(isValidRoleKey("admin")).toBe(true);
    expect(isValidRoleKey("ops-lead")).toBe(true);
    expect(isValidRoleKey("Admin")).toBe(false);
  });

  it("accepts only internal menu hrefs", () => {
    expect(isSafeInternalHref("/app/users")).toBe(true);
    expect(isSafeInternalHref("")).toBe(true);
    expect(isSafeInternalHref("https://evil.example")).toBe(false);
    expect(isSafeInternalHref("//evil.example")).toBe(false);
  });

  it("enforces the directory / page / action tree rules", () => {
    expect(isValidMenuNode({ type: "directory", parentType: null, permissionKey: null, href: "" })).toBe(true);
    expect(isValidMenuNode({ type: "directory", parentType: "directory", permissionKey: null, href: "" })).toBe(false);
    expect(isValidMenuNode({ type: "directory", parentType: null, permissionKey: "users:read", href: "" })).toBe(false);

    expect(isValidMenuNode({ type: "page", parentType: null, permissionKey: "orders:read", href: "/app/orders" })).toBe(true);
    expect(isValidMenuNode({ type: "page", parentType: "directory", permissionKey: null, href: "/app/help" })).toBe(true);
    expect(isValidMenuNode({ type: "page", parentType: "page", permissionKey: null, href: "/app/help" })).toBe(false);
    expect(isValidMenuNode({ type: "page", parentType: null, permissionKey: null, href: "" })).toBe(false);
    expect(isValidMenuNode({ type: "page", parentType: null, permissionKey: null, href: "https://evil.example" })).toBe(false);

    expect(isValidMenuNode({ type: "action", parentType: "page", permissionKey: "orders:export", href: "" })).toBe(true);
    expect(isValidMenuNode({ type: "action", parentType: "directory", permissionKey: "reports:run", href: "" })).toBe(true);
    expect(isValidMenuNode({ type: "action", parentType: null, permissionKey: "orders:export", href: "" })).toBe(false);
    expect(isValidMenuNode({ type: "action", parentType: "page", permissionKey: null, href: "" })).toBe(false);
    expect(isValidMenuNode({ type: "action", parentType: "page", permissionKey: "Orders", href: "" })).toBe(false);
  });

  it("never allows a system role to become the default signup role", () => {
    expect(canBeDefaultRole({ isSystem: true })).toBe(false);
    expect(canBeDefaultRole({ isSystem: false })).toBe(true);
  });
});
