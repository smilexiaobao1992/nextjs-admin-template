import type { NextRequest } from "next/server";
import { listAuditLogsForExport } from "@/lib/audit/queries";
import { getSession } from "@/lib/auth/session";
import { buildCsv, createCsvResponse } from "@/lib/list/csv";
import { isSystemAdminRole, roleHasPermission } from "@/lib/rbac/permissions";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const roleKey = session.user.role ?? "";
  const allowed =
    isSystemAdminRole(roleKey) || (await roleHasPermission(roleKey, "audit:read"));
  if (!allowed) {
    return new Response("Forbidden", { status: 403 });
  }

  const q = request.nextUrl.searchParams.get("q") ?? "";
  const rows = await listAuditLogsForExport(q);

  const csv = buildCsv(rows, [
    { header: "时间", value: (row) => row.createdAt },
    { header: "操作人邮箱", value: (row) => row.actorEmail ?? "" },
    { header: "动作", value: (row) => row.action },
    { header: "摘要", value: (row) => row.summary },
    { header: "资源类型", value: (row) => row.resourceType },
    { header: "资源ID", value: (row) => row.resourceId ?? "" },
    { header: "IP地址", value: (row) => row.ipAddress ?? "" },
  ]);

  return createCsvResponse(csv, `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
}
