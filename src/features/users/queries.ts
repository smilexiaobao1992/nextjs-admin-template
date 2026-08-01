import { asc, count, desc, eq, gt, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { role, session, user } from "@/lib/db/schema";
import { clampPage, escapeLikePattern, type ParsedListQuery } from "@/lib/list/pagination";

function userSearchCondition(q: string): SQL | undefined {
  if (!q) {
    return undefined;
  }
  const pattern = `%${escapeLikePattern(q)}%`;
  return or(ilike(user.name, pattern), ilike(user.email, pattern), ilike(user.role, pattern));
}

export async function listUsersPage(query: ParsedListQuery) {
  const where = userSearchCondition(query.q);
  const [totalRow] = await db.select({ value: count() }).from(user).where(where);
  const total = Number(totalRow?.value ?? 0);
  const page = clampPage(query.page, total, query.pageSize);
  const offset = (page - 1) * query.pageSize;

  const items = await db
    .select()
    .from(user)
    .where(where)
    .orderBy(asc(user.createdAt))
    .limit(query.pageSize)
    .offset(offset);

  return { items, total, page, pageSize: query.pageSize, q: query.q };
}

export async function listUsers() {
  return db.select().from(user).orderBy(asc(user.createdAt));
}

export type ListedUser = Awaited<ReturnType<typeof listUsers>>[number];

export async function countUsers() {
  const [row] = await db.select({ value: count() }).from(user);
  return Number(row?.value ?? 0);
}

export async function countBannedUsers() {
  const [row] = await db.select({ value: count() }).from(user).where(eq(user.banned, true));
  return Number(row?.value ?? 0);
}

export async function countActiveSessions() {
  const [row] = await db
    .select({ value: count() })
    .from(session)
    .where(gt(session.expiresAt, new Date()));
  return Number(row?.value ?? 0);
}

export async function countRoles() {
  const [row] = await db.select({ value: count() }).from(role);
  return Number(row?.value ?? 0);
}

export async function listRecentUsers(limit = 5) {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(limit);
}
