import { describe, expect, it } from "vitest";
import {
  canBeDefaultRole,
  isSafeInternalHref,
  isValidMenuParentSelection,
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

  it("accepts only root menus as parents and rejects self-parenting", () => {
    expect(isValidMenuParentSelection({ menuId: "child", parentId: null, parentParentId: null })).toBe(true);
    expect(isValidMenuParentSelection({ menuId: "child", parentId: "root", parentParentId: null })).toBe(true);
    expect(isValidMenuParentSelection({ menuId: "root", parentId: "root", parentParentId: null })).toBe(false);
    expect(isValidMenuParentSelection({ menuId: "child", parentId: "nested", parentParentId: "root" })).toBe(false);
    expect(isValidMenuParentSelection({ menuId: "root", parentId: "other-root", parentParentId: null, menuHasChildren: true })).toBe(false);
  });

  it("never allows a system role to become the default signup role", () => {
    expect(canBeDefaultRole({ isSystem: true })).toBe(false);
    expect(canBeDefaultRole({ isSystem: false })).toBe(true);
  });
});
