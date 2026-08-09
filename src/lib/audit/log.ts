import { headers } from "next/headers";
import type { AuditActor } from "./persistence";

export { writeAuditLog } from "./persistence";
export type { AuditActor, WriteAuditLogInput } from "./persistence";

export async function getRequestIpAddress(): Promise<string | null> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || null;
  }
  return headerStore.get("x-real-ip");
}

export function actorFromSession(session: {
  user: { id: string; email: string };
}): AuditActor {
  return {
    userId: session.user.id,
    email: session.user.email,
  };
}
