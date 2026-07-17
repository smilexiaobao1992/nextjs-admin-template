import { redirect } from "next/navigation";
import AppShell from "@/components/layout/app-shell";
import { buildLoginHref } from "@/lib/auth/authorization";
import { getRequestPathname, getSession } from "@/lib/auth/session";
import { getRoleByKey, listMenusForRoleKey } from "@/lib/rbac/permissions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

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
    >
      {children}
    </AppShell>
  );
}
