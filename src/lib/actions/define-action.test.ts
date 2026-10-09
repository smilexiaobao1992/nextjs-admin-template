import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const redirectMock = vi.fn((href: string) => {
  throw Object.assign(new Error("NEXT_REDIRECT"), { href });
});
const revalidateMock = vi.fn();
const requirePermissionMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (href: string) => redirectMock(href),
  unstable_rethrow: (error: unknown) => {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: (path: string) => revalidateMock(path) }));
vi.mock("@/lib/auth/session", () => ({
  requirePermission: (key: string) => requirePermissionMock(key),
  requireSession: vi.fn(),
}));
vi.mock("@/lib/audit/log", () => ({
  auditFor: async (_session: unknown, entry: object) => ({ ...entry, actor: { userId: "u1", email: "a@b.c" } }),
}));

const { ActionError, defineAction } = await import("./define-action");
const { field } = await import("./form");
const { withNotice } = await import("./notice");

async function run(action: (fd: FormData) => Promise<void>, entries: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) fd.append(key, value);
  try {
    await action(fd);
  } catch (error) {
    return (error as { href?: string }).href;
  }
  return undefined;
}

describe("withNotice", () => {
  it("merges with existing params and keeps the hash", () => {
    expect(withNotice("/app/menus?selected=1#detail", "created")).toBe("/app/menus?selected=1&notice=created#detail");
    expect(withNotice("/app/x?notice=old", "new")).toBe("/app/x?notice=new");
  });
});

describe("defineAction", () => {
  beforeEach(() => {
    requirePermissionMock.mockResolvedValue({ user: { id: "u1", email: "a@b.c", role: "member" } });
  });

  const schema = z.object({ name: field.text({ max: 5 }) });

  it("checks permission, runs the handler, revalidates, and redirects with the success notice", async () => {
    const handler = vi.fn(async () => "id-1");
    const action = defineAction({
      permission: "orders:create",
      schema,
      handler,
      redirectTo: ({ result }) => `/app/orders?selected=${result}`,
      success: "created",
      revalidate: ["/app/orders"],
    });

    expect(await run(action, { name: "Pen" })).toBe("/app/orders?selected=id-1&notice=created");
    expect(requirePermissionMock).toHaveBeenCalledWith("orders:create");
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { name: "Pen" } }));
    expect(revalidateMock).toHaveBeenCalledWith("/app/orders");
  });

  it("redirects with invalid_input without calling the handler", async () => {
    const handler = vi.fn();
    const action = defineAction({ permission: "orders:create", schema, handler, redirectTo: "/app/orders" });
    expect(await run(action, { name: "" })).toBe("/app/orders?notice=invalid_input");
    expect(handler).not.toHaveBeenCalled();
  });

  it("maps ActionError and domain errors to notice codes", async () => {
    const a = defineAction({
      permission: "x:y",
      schema,
      redirectTo: "/app/orders",
      handler: async () => {
        throw new ActionError("duplicate");
      },
    });
    expect(await run(a, { name: "Pen" })).toBe("/app/orders?notice=duplicate");

    const b = defineAction({
      permission: "x:y",
      schema,
      redirectTo: "/app/orders",
      mapError: (error) => (error instanceof RangeError ? "in_use" : null),
      handler: async () => {
        throw new RangeError("boom");
      },
    });
    expect(await run(b, { name: "Pen" })).toBe("/app/orders?notice=in_use");
  });

  it("falls back to failed for unknown errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const action = defineAction({
      permission: "x:y",
      schema,
      redirectTo: "/app/orders",
      handler: async () => {
        throw new Error("db down");
      },
    });
    expect(await run(action, { name: "Pen" })).toBe("/app/orders?notice=failed");
  });
});
