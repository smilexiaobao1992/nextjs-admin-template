import { asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { clampPage, escapeLikePattern, type ParsedListQuery } from "@/lib/list/pagination";

export const AUDIT_SORT_COLUMNS = ["createdAt", "action", "actorEmail", "resourceType"] as const;

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

function resolveAuditOrder(sort: string, order: "asc" | "desc") {
  const dir = order === "asc" ? asc : desc;
  switch (sort) {
    case "action":
      return dir(auditLog.action);
    case "actorEmail":
      return dir(auditLog.actorEmail);
    case "resourceType":
      return dir(auditLog.resourceType);
    case "createdAt":
    default:
      return dir(auditLog.createdAt);
  }
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
    .orderBy(resolveAuditOrder(query.sort, query.order))
    .limit(query.pageSize)
    .offset(offset);

  return {
    items,
    total,
    page,
    pageSize: query.pageSize,
    sort: query.sort,
    order: query.order,
  };
}

export async function listAuditLogsForExport(q = "", limit = 2000) {
  const where = searchCondition(q.trim().slice(0, 100));
  return db
    .select()
    .from(auditLog)
    .where(where)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);
}

export async function countAuditLogs() {
  const [row] = await db.select({ value: count() }).from(auditLog);
  return Number(row?.value ?? 0);
}

export async function getAuditLogById(id: string) {
  const [row] = await db.select().from(auditLog).where(eq(auditLog.id, id)).limit(1);
  return row ?? null;
}

export async function listAuditLogsByActor(actorUserId: string, limit = 15) {
  return db
    .select()
    .from(auditLog)
    .where(eq(auditLog.actorUserId, actorUserId))
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);
}
