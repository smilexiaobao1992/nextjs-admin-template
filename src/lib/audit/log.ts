import { headers } from "next/headers";
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

export async function getRequestIpAddress(): Promise<string | null> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || null;
  }
  return headerStore.get("x-real-ip");
}

/** Insert one immutable audit row. Failures are thrown so callers can decide. */
export async function writeAuditLog(input: WriteAuditLogInput) {
  await db.insert(auditLog).values({
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

export function actorFromSession(session: {
  user: { id: string; email: string };
}): AuditActor {
  return {
    userId: session.user.id,
    email: session.user.email,
  };
}
