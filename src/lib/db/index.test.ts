import { describe, expect, it } from "vitest";

describe("database client", () => {
  it("keeps enough pooled connections for parallel dashboard queries", async () => {
    process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
    const { dbClient } = await import("./index");

    expect(dbClient.options.max).toBeGreaterThanOrEqual(8);
    await dbClient.end();
  });
});
