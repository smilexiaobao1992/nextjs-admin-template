import { gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog, role, session, user } from "@/lib/db/schema";

export async function getDashboardStats({
  includeUsers,
  includeRoles,
  includeAudit,
  auditSince,
}: {
  includeUsers: boolean;
  includeRoles: boolean;
  includeAudit: boolean;
  auditSince: Date;
}) {
  const rows = await db.execute<{
    userCount: number | null;
    bannedCount: number | null;
    sessionCount: number | null;
    roleCount: number | null;
    recentAuditCount: number | null;
  }>(sql`
    select
      ${includeUsers ? sql`(select count(*)::int from ${user})` : sql`null`} as "userCount",
      ${includeUsers ? sql`(select count(*)::int from ${user} where ${user.banned} = true)` : sql`null`} as "bannedCount",
      ${includeUsers ? sql`(select count(*)::int from ${session} where ${session.expiresAt} > now())` : sql`null`} as "sessionCount",
      ${includeRoles ? sql`(select count(*)::int from ${role})` : sql`null`} as "roleCount",
      ${includeAudit ? sql`(select count(*)::int from ${auditLog} where ${gte(auditLog.createdAt, auditSince)})` : sql`null`} as "recentAuditCount"
  `);
  const row = rows[0];

  return row ?? {
    userCount: null,
    bannedCount: null,
    sessionCount: null,
    roleCount: null,
    recentAuditCount: null,
  };
}
