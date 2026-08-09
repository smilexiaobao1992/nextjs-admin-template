import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AppShell from "@/components/layout/app-shell";
import { buildLoginHref } from "@/lib/auth/authorization";
import { getRequestPathname, getSession } from "@/lib/auth/session";
import { listMenusForRoleKey, listRolesForRoleValue } from "@/lib/rbac/permissions";
import { ADMIN_THEME_COOKIE, parseAdminTheme } from "@/lib/admin-theme";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [session, cookieStore] = await Promise.all([getSession(), cookies()]);

  if (!session) {
    redirect(buildLoginHref(await getRequestPathname()));
  }

  const roleKey = session.user.role ?? "member";
  const [menus, roleRows] = await Promise.all([
    listMenusForRoleKey(roleKey),
    listRolesForRoleValue(roleKey),
  ]);

  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
        role: roleKey,
        roleLabel: roleRows.map((item) => item.name).join("、") || roleKey,
      }}
      menus={menus}
      initialTheme={parseAdminTheme(cookieStore.get(ADMIN_THEME_COOKIE)?.value)}
    >
      {children}
    </AppShell>
  );
}
