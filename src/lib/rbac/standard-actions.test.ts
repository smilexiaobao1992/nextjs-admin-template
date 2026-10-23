import { describe, expect, it } from "vitest";
import { derivePagePermissionKeyFromHref, deriveStandardActions } from "./standard-actions";

describe("derivePagePermissionKeyFromHref", () => {
  it("derives resource:read from /app/* routes", () => {
    expect(derivePagePermissionKeyFromHref("/app/orders")).toBe("orders:read");
    expect(derivePagePermissionKeyFromHref("/app/inventory-items")).toBe("inventory_items:read");
    expect(derivePagePermissionKeyFromHref("/app/billing/invoices")).toBe("billing_invoices:read");
  });

  it("handles root /app as dashboard:view", () => {
    expect(derivePagePermissionKeyFromHref("/app")).toBe("dashboard:view");
  });
});

describe("deriveStandardActions", () => {
  it("derives keys from the page resource in a stable order", () => {
    expect(deriveStandardActions("orders:read", ["delete", "create"])).toEqual([
      { title: "新增", permissionKey: "orders:create", sortOrder: 10 },
      { title: "删除", permissionKey: "orders:delete", sortOrder: 20 },
    ]);
  });

  it("returns nothing when the page has no valid permission key", () => {
    expect(deriveStandardActions(null, ["create"])).toEqual([]);
    expect(deriveStandardActions("", ["create"])).toEqual([]);
    expect(deriveStandardActions("Bad Key", ["create"])).toEqual([]);
  });

  it("ignores unknown verbs and never duplicates the page key", () => {
    expect(deriveStandardActions("orders:create", ["create", "update", "drop"])).toEqual([
      { title: "编辑", permissionKey: "orders:update", sortOrder: 10 },
    ]);
  });
});
