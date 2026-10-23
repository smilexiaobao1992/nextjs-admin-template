import { gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog, role, session, user } from "@/lib/db/schema";
import { APP_TIME_ZONE } from "@/lib/utils";

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

export type AuditDailyPoint = {
  key: string;
  label: string;
  count: number;
};

function formatDayKey(date: Date): string {
  return date.toLocaleDateString("sv-SE", { timeZone: APP_TIME_ZONE });
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString("zh-CN", {
    timeZone: APP_TIME_ZONE,
    month: "numeric",
    day: "numeric",
  });
}

export async function getRecentAuditDailySeries(days = 7): Promise<AuditDailyPoint[]> {
  const now = new Date();
  const since = new Date(now);
  since.setUTCDate(since.getUTCDate() - (days - 1));
  since.setUTCHours(0, 0, 0, 0);

  const rows = await db.execute<{ day: string; count: number }>(sql`
    select
      to_char(${auditLog.createdAt} at time zone ${APP_TIME_ZONE}, 'YYYY-MM-DD') as "day",
      count(*)::int as "count"
    from ${auditLog}
    where ${gte(auditLog.createdAt, since)}
    group by 1
  `);

  const countsByDay = new Map<string, number>();
  for (const row of rows) {
    countsByDay.set(row.day, Number(row.count));
  }

  const series: AuditDailyPoint[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setUTCDate(day.getUTCDate() - offset);
    const key = formatDayKey(day);
    series.push({
      key,
      label: formatDayLabel(day),
      count: countsByDay.get(key) ?? 0,
    });
  }
  return series;
}
