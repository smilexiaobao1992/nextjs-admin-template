import { describe, expect, it } from "vitest";
import {
  buildLoginHref,
  canManageRolePermissionSets,
  canManageSystemRole,
  canChangeRole,
  isAdminSession,
  safeRedirectPath,
  validateCredentialPassword,
} from "@/lib/auth/authorization";

describe("authorization helpers", () => {
  it("only treats the admin role as an administrator", () => {
    expect(isAdminSession(null)).toBe(false);
    expect(isAdminSession({ user: { role: "user" } })).toBe(false);
    expect(isAdminSession({ user: { role: "admin" } })).toBe(true);
  });

  it("applies one strong-password rule to all credential users", () => {
    expect(validateCredentialPassword("short1")).toBe(false);
    expect(validateCredentialPassword("onlyletterslong")).toBe(false);
    expect(validateCredentialPassword("123456789012")).toBe(false);
    expect(validateCredentialPassword("admin-template-2026")).toBe(true);
  });

  it("accepts only local redirect paths", () => {
    expect(safeRedirectPath("/app/users")).toBe("/app/users");
    expect(safeRedirectPath("/app/users?tab=active#list")).toBe("/app/users?tab=active#list");
    expect(safeRedirectPath("https://attacker.example")).toBe("/app");
    expect(safeRedirectPath("//attacker.example")).toBe("/app");
    expect(safeRedirectPath("/\\attacker.example")).toBe("/app");
    expect(safeRedirectPath("/app\n/users")).toBe("/app");
    expect(safeRedirectPath(null)).toBe("/app");
  });

  it("builds login URLs that preserve a safe next path", () => {
    expect(buildLoginHref("/app/users")).toBe("/login?next=%2Fapp%2Fusers");
    expect(buildLoginHref("https://attacker.example")).toBe("/login?next=%2Fapp");
  });

  it("never allows the last administrator to be downgraded", () => {
    expect(canChangeRole({ currentRole: "admin", nextRole: "member", adminCount: 1 })).toBe(false);
    expect(canChangeRole({ currentRole: "admin", nextRole: "member", adminCount: 2 })).toBe(true);
    expect(canChangeRole({ currentRole: "member", nextRole: "admin", adminCount: 1 })).toBe(true);
    expect(canChangeRole({ currentRole: "admin", nextRole: "admin", adminCount: 1 })).toBe(true);
  });

  it("allows only an administrator to grant or remove a system role", () => {
    expect(canManageSystemRole({ actorRole: "member", currentRoleIsSystem: false, nextRoleIsSystem: true })).toBe(false);
    expect(canManageSystemRole({ actorRole: "member", currentRoleIsSystem: true, nextRoleIsSystem: false })).toBe(false);
    expect(canManageSystemRole({ actorRole: "member", currentRoleIsSystem: false, nextRoleIsSystem: false })).toBe(true);
    expect(canManageSystemRole({ actorRole: "admin", currentRoleIsSystem: false, nextRoleIsSystem: true })).toBe(true);
    expect(canManageSystemRole({ actorRole: "admin", currentRoleIsSystem: true, nextRoleIsSystem: false })).toBe(true);
  });

  it("prevents delegated user managers from assigning or editing roles above their own permissions", () => {
    const actorPermissionIds = ["users:read", "users:write"];

    expect(canManageRolePermissionSets({
      actorPermissionIds,
      currentPermissionIds: ["users:read"],
      nextPermissionIds: ["users:read"],
    })).toBe(true);
    expect(canManageRolePermissionSets({
      actorPermissionIds,
      currentPermissionIds: [],
      nextPermissionIds: ["users:read", "roles:write"],
    })).toBe(false);
    expect(canManageRolePermissionSets({
      actorPermissionIds,
      currentPermissionIds: ["users:read", "roles:write"],
      nextPermissionIds: ["users:read"],
    })).toBe(false);
  });
});
