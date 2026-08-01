import { count, desc, eq, gte, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { clampPage, escapeLikePattern, type ParsedListQuery } from "@/lib/list/pagination";

function searchCondition(q: string): SQL | undefined {
  if (!q) {
    return undefined;
  }
  const pattern = `%${escapeLikePattern(q)}%`;
  return or(
    ilike(auditLog.summary, pattern),
    ilike(auditLog.action, pattern),
    ilike(auditLog.actorEmail, pattern),
    ilike(auditLog.resourceType, pattern),
    ilike(auditLog.resourceId, pattern),
  );
}

export async function listAuditLogsPage(query: ParsedListQuery) {
  const where = searchCondition(query.q);
  const [totalRow] = await db
    .select({ value: count() })
    .from(auditLog)
    .where(where);

  const total = Number(totalRow?.value ?? 0);
  const page = clampPage(query.page, total, query.pageSize);
  const offset = (page - 1) * query.pageSize;

  const items = await db
    .select()
    .from(auditLog)
    .where(where)
    .orderBy(desc(auditLog.createdAt))
    .limit(query.pageSize)
    .offset(offset);

  return { items, total, page, pageSize: query.pageSize };
}

export async function countAuditLogs() {
  const [row] = await db.select({ value: count() }).from(auditLog);
  return Number(row?.value ?? 0);
}

export async function countRecentAuditLogs(since: Date) {
  // Use gte() so Date is bound as a timestamp, not Date#toString().
  const [row] = await db
    .select({ value: count() })
    .from(auditLog)
    .where(gte(auditLog.createdAt, since));
  return Number(row?.value ?? 0);
}

export async function getAuditLogById(id: string) {
  const [row] = await db.select().from(auditLog).where(eq(auditLog.id, id)).limit(1);
  return row ?? null;
}
