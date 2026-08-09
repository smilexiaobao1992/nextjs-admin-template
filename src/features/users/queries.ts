import { asc, count, desc, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
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
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(where)
    .orderBy(asc(user.createdAt))
    .limit(query.pageSize)
    .offset(offset);

  return { items, total, page, pageSize: query.pageSize, q: query.q };
}

export type ListedUser = Awaited<ReturnType<typeof listUsersPage>>["items"][number];

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
