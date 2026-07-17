import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { buildLoginHref } from "./authorization";
import { isSystemAdminRole, roleHasPermission } from "@/lib/rbac/permissions";

export async function getRequestPathname(): Promise<string> {
  const headerStore = await headers();
  return headerStore.get("x-pathname") ?? "/app";
}

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

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
    redirect("/app?notice=forbidden");
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
    redirect("/app?notice=forbidden");
  }

  return session;
}
