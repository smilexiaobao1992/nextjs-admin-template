import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

export async function listUsers() {
  return db.select().from(user).orderBy(asc(user.createdAt));
}

export type ListedUser = Awaited<ReturnType<typeof listUsers>>[number];
