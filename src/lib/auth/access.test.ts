import { describe, expect, it } from "vitest";
import { adminRole, userRole } from "./access";

describe("Better Auth admin access control", () => {
  it("allows administrators to list users but denies every mutation", () => {
    expect(adminRole.authorize({ user: ["list"] }).success).toBe(true);
    expect(adminRole.authorize({ user: ["create"] }).success).toBe(false);
    expect(adminRole.authorize({ user: ["set-role"] }).success).toBe(false);
    expect(adminRole.authorize({ user: ["update"] }).success).toBe(false);
    expect(adminRole.authorize({ user: ["set-password"] }).success).toBe(false);
    expect(adminRole.authorize({ user: ["ban"] }).success).toBe(false);
    expect(adminRole.authorize({ user: ["delete"] }).success).toBe(false);
    expect(adminRole.authorize({ session: ["revoke"] }).success).toBe(false);
  });

  it("does not grant normal users any admin-plugin permissions", () => {
    expect(userRole.authorize({ user: ["list"] }).success).toBe(false);
  });
});
