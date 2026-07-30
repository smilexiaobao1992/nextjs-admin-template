import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AppShell from "@/components/layout/app-shell";
import { buildLoginHref } from "@/lib/auth/authorization";
import { getRequestPathname, getSession } from "@/lib/auth/session";
import { getRoleByKey, listMenusForRoleKey } from "@/lib/rbac/permissions";
import { ADMIN_THEME_COOKIE, parseAdminTheme } from "@/lib/admin-theme";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [session, cookieStore] = await Promise.all([getSession(), cookies()]);

  if (!session) {
    redirect(buildLoginHref(await getRequestPathname()));
  }

  const roleKey = session.user.role ?? "member";
  const [menus, roleRow] = await Promise.all([
    listMenusForRoleKey(roleKey),
    getRoleByKey(roleKey),
  ]);

  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
        role: roleKey,
        roleLabel: roleRow?.name ?? roleKey,
      }}
      menus={menus}
      initialTheme={parseAdminTheme(cookieStore.get(ADMIN_THEME_COOKIE)?.value)}
    >
      {children}
    </AppShell>
  );
}
