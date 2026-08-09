const MIN_SECRET_BYTES = 32;

export function validateBetterAuthSecret(value: string | undefined): string {
  if (!value || Buffer.byteLength(value, "utf8") < MIN_SECRET_BYTES) {
    throw new Error(
      `BETTER_AUTH_SECRET must be set and at least ${MIN_SECRET_BYTES} bytes. Generate with: openssl rand -base64 32`,
    );
  }

  const normalized = value.trim().toLowerCase();
  if (
    normalized.includes("replace-with") ||
    normalized.includes("change-me") ||
    normalized.includes("your-secret")
  ) {
    throw new Error("BETTER_AUTH_SECRET still contains a public placeholder. Generate a unique value.");
  }

  return value;
}

export function validateBetterAuthUrl(value: string | undefined): string | undefined {
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("BETTER_AUTH_URL is required in production.");
    }
    return undefined;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("BETTER_AUTH_URL must use http or https.");
    }
    const localHostnames = new Set(["localhost", "127.0.0.1", "::1"]);
    if (
      process.env.NODE_ENV === "production" &&
      url.protocol !== "https:" &&
      !localHostnames.has(url.hostname)
    ) {
      throw new Error("BETTER_AUTH_URL must use https in production.");
    }
    return value;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("BETTER_AUTH_URL")) {
      throw error;
    }
    throw new Error("BETTER_AUTH_URL must be an absolute URL, e.g. http://localhost:3000");
  }
}
