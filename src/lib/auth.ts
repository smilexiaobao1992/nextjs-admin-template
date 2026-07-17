import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { defaultAc } from "better-auth/plugins/admin/access";
import type { AccessControl } from "better-auth/plugins/access";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { adminRole, userRole } from "@/lib/auth/access";
import { validateBetterAuthSecret, validateBetterAuthUrl } from "@/lib/auth/env";

function trustedOrigins(): string[] | undefined {
  const value = process.env.BETTER_AUTH_TRUSTED_ORIGINS;
  return value?.split(",").map((origin) => origin.trim()).filter(Boolean);
}

export const auth = betterAuth({
  appName: "Next.js Admin Template",
  baseURL: validateBetterAuthUrl(process.env.BETTER_AUTH_URL),
  secret: validateBetterAuthSecret(process.env.BETTER_AUTH_SECRET),
  trustedOrigins: trustedOrigins(),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
  },
  session: {
    cookieCache: {
      enabled: false,
    },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
  },
  plugins: [
    admin({
      ac: defaultAc as AccessControl,
      roles: {
        admin: adminRole,
        user: userRole,
      },
    }),
    nextCookies(),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
