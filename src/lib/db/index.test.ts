import { describe, expect, it } from "vitest";

describe("database client", () => {
  it("caps each application instance to a conservative connection pool", async () => {
    process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
    const { dbClient } = await import("./index");

    expect(dbClient.options.max).toBe(5);
    await dbClient.end();
  });
});
