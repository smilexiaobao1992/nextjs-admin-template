import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { execute } = vi.hoisted(() => ({ execute: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: { execute },
}));

import { getDashboardStats } from "./queries";

describe("getDashboardStats", () => {
  beforeEach(() => {
    execute.mockReset();
    execute.mockResolvedValue([{
      userCount: 1,
      bannedCount: 0,
      sessionCount: 1,
      roleCount: 2,
      recentAuditCount: 3,
    }]);
  });

  it("encodes the audit cutoff as a PostgreSQL timestamp parameter", async () => {
    const auditSince = new Date("2026-08-02T04:18:00.650Z");

    await getDashboardStats({
      includeUsers: true,
      includeRoles: true,
      includeAudit: true,
      auditSince,
    });

    const query = new PgDialect().sqlToQuery(execute.mock.calls[0][0]);
    expect(query.params).toEqual(["2026-08-02T04:18:00.650Z"]);
  });
});
