import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";

export type AuditActor = {
  userId: string | null;
  email: string | null;
};

export type WriteAuditLogInput = {
  actor: AuditActor;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
};

type AuditDatabase = Pick<typeof db, "insert">;

export async function writeAuditLog(input: WriteAuditLogInput, database: AuditDatabase = db) {
  await database.insert(auditLog).values({
    id: crypto.randomUUID(),
    actorUserId: input.actor.userId,
    actorEmail: input.actor.email,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId ?? null,
    summary: input.summary,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    ipAddress: input.ipAddress ?? null,
  });
}
