import { afterEach, describe, expect, it, vi } from "vitest";
import { validateBetterAuthSecret, validateBetterAuthUrl } from "./env";

describe("auth environment validation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires a secret of at least 32 bytes", () => {
    expect(() => validateBetterAuthSecret(undefined)).toThrow(/BETTER_AUTH_SECRET/);
    expect(() => validateBetterAuthSecret("too-short")).toThrow(/32 bytes/);
    expect(() => validateBetterAuthSecret("replace-with-at-least-32-random-bytes")).toThrow(/placeholder/);
    expect(() => validateBetterAuthSecret("change-me-change-me-change-me-change-me")).toThrow(/placeholder/);
    expect(validateBetterAuthSecret("ci-only-secret-with-at-least-32-bytes")).toBe(
      "ci-only-secret-with-at-least-32-bytes",
    );
  });

  it("accepts absolute http(s) auth URLs", () => {
    expect(validateBetterAuthUrl(undefined)).toBeUndefined();
    expect(validateBetterAuthUrl("http://localhost:3000")).toBe("http://localhost:3000");
    expect(() => validateBetterAuthUrl("not-a-url")).toThrow(/BETTER_AUTH_URL/);
  });

  it("requires an HTTPS public origin in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(() => validateBetterAuthUrl(undefined)).toThrow(/required/);
    expect(() => validateBetterAuthUrl("http://admin.example.com")).toThrow(/https/);
    expect(validateBetterAuthUrl("https://admin.example.com")).toBe("https://admin.example.com");
    expect(validateBetterAuthUrl("http://localhost:3000")).toBe("http://localhost:3000");
  });
});
