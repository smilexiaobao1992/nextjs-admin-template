import type { NextRequest } from "next/server";
import { listUsersForExport } from "@/features/users/queries";
import { getSession } from "@/lib/auth/session";
import { buildCsv, createCsvResponse } from "@/lib/list/csv";
import { isSystemAdminRole, listAllRoles, roleHasPermission } from "@/lib/rbac/permissions";
import { parseRoleKeys } from "@/lib/rbac/role-keys";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const roleKey = session.user.role ?? "";
  const allowed =
    isSystemAdminRole(roleKey) || (await roleHasPermission(roleKey, "users:read"));
  if (!allowed) {
    return new Response("Forbidden", { status: 403 });
  }

  const q = request.nextUrl.searchParams.get("q") ?? "";
  const [rows, roles] = await Promise.all([listUsersForExport(q), listAllRoles()]);
  const roleNameByKey = Object.fromEntries(roles.map((item) => [item.key, item.name]));

  const csv = buildCsv(rows, [
    { header: "姓名", value: (row) => row.name },
    { header: "邮箱", value: (row) => row.email },
    {
      header: "角色",
      value: (row) =>
        parseRoleKeys(row.role)
          .map((key) => roleNameByKey[key] ?? key)
          .join("、"),
    },
    { header: "状态", value: (row) => (row.banned ? "已封禁" : "正常") },
    { header: "封禁原因", value: (row) => row.banReason ?? "" },
    { header: "创建时间", value: (row) => row.createdAt },
  ]);

  return createCsvResponse(csv, `users-${new Date().toISOString().slice(0, 10)}.csv`);
}
