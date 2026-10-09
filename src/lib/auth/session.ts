import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { buildLoginHref } from "./authorization";
import { isSystemAdminRole, roleHasPermission } from "@/lib/rbac/permissions";

export async function getRequestPathname(): Promise<string> {
  const headerStore = await headers();
  return headerStore.get("x-pathname") ?? "/app";
}

export const getSession = cache(async function getSession() {
  return auth.api.getSession({ headers: await headers() });
});

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect(buildLoginHref(await getRequestPathname()));
  }

  return session;
}

/** @deprecated Prefer requirePermission for app authorization. Kept for admin-plugin style checks. */
export async function requireAdminSession() {
  const session = await requireSession();

  if (!isSystemAdminRole(session.user.role)) {
    redirect("/app/profile?notice=forbidden");
  }

  return session;
}

export async function requirePermission(permissionKey: string) {
  const session = await requireSession();
  const roleKey = session.user.role ?? "";

  if (isSystemAdminRole(roleKey)) {
    return session;
  }

  const allowed = await roleHasPermission(roleKey, permissionKey);
  if (!allowed) {
    redirect("/app/profile?notice=forbidden");
  }

  return session;
}

export type AppSession = Awaited<ReturnType<typeof requireSession>>;

/**
 * Non-redirecting permission check for conditional UI (show a button, enable a form).
 * Server Actions must still call requirePermission; hiding UI is not authorization.
 */
export async function can(session: Pick<AppSession, "user">, permissionKey: string): Promise<boolean> {
  return roleHasPermission(session.user.role ?? "", permissionKey);
}
