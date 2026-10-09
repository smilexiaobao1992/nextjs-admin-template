import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import type { z } from "zod";
import { auditFor, type WriteAuditLogInput } from "@/lib/audit/log";
import { requirePermission, requireSession, type AppSession } from "@/lib/auth/session";
import { parseFormData } from "./form";
import { withNotice } from "./notice";

/** Throw from a handler to redirect back with `?notice=<code>` (add the code to the feature's messages.ts). */
export class ActionError extends Error {
  constructor(public readonly code: string, message?: string) {
    super(message ?? code);
    this.name = "ActionError";
  }
}

type AuditEntry = Omit<WriteAuditLogInput, "actor" | "ipAddress">;

export type ActionContext<Input> = {
  session: AppSession;
  input: Input;
  /** Build an audit entry for the signed-in actor; pass it to writeAuditLog(entry, tx) inside your transaction. */
  audit: (entry: AuditEntry) => Promise<WriteAuditLogInput>;
};

type Target<Input, Result> = string | ((ctx: { input: Input; result: Result }) => string);

export type DefineActionConfig<S extends z.ZodType, Result> = {
  /** Permission key checked with requirePermission, or null for any signed-in user. */
  permission: string | null;
  schema: S;
  handler: (ctx: ActionContext<z.output<S>>) => Promise<Result>;
  /** Where to go after success. The success notice is appended as `?notice=`. */
  redirectTo: Target<z.output<S>, Result>;
  /** Where to go after a validation or handler error. Defaults to the static `redirectTo`. */
  errorRedirectTo?: string;
  /** Notice code on success, e.g. "created". Defaults to "saved". */
  success?: string;
  /** Paths to revalidate after success (the redirect target is not revalidated automatically). */
  revalidate?: string[];
  /** Map domain errors (e.g. RbacError) to notice codes. Return null to fall through to "failed". */
  mapError?: (error: unknown) => string | null;
};

/**
 * Standard Server Action pipeline:
 *   requirePermission → zod validation → handler → revalidate → redirect with notice.
 *
 * Validation failures redirect with `invalid_input`; ActionError redirects with its code;
 * unknown errors are logged and redirect with `failed`. Next.js redirect/notFound thrown
 * inside the handler are rethrown untouched.
 *
 * @example
 *   export const createOrderAction = defineAction({
 *     permission: "orders:create",
 *     schema: z.object({ name: field.text({ max: 80 }) }),
 *     redirectTo: "/app/orders",
 *     success: "created",
 *     revalidate: ["/app/orders"],
 *     handler: async ({ input, audit }) => {
 *       await db.transaction(async (tx) => {
 *         const id = crypto.randomUUID();
 *         await tx.insert(order).values({ id, name: input.name });
 *         await writeAuditLog(await audit({ action: "order.create", resourceType: "order", resourceId: id, summary: `创建订单 ${input.name}` }), tx);
 *       });
 *     },
 *   });
 */
export function defineAction<S extends z.ZodType, Result = void>(config: DefineActionConfig<S, Result>) {
  return async function action(formData: FormData): Promise<void> {
    const session = config.permission ? await requirePermission(config.permission) : await requireSession();
    const fallback = config.errorRedirectTo ?? (typeof config.redirectTo === "string" ? config.redirectTo : "/app");

    const parsed = parseFormData(config.schema, formData);
    if (!parsed.success) {
      redirect(withNotice(fallback, "invalid_input"));
    }

    let result: Result;
    try {
      result = await config.handler({
        session,
        input: parsed.data,
        audit: (entry) => auditFor(session, entry),
      });
    } catch (error) {
      unstable_rethrow(error);
      const code = error instanceof ActionError ? error.code : config.mapError?.(error) ?? null;
      if (!code) {
        console.error("[defineAction] unexpected error", error);
      }
      redirect(withNotice(fallback, code ?? "failed"));
    }

    for (const path of config.revalidate ?? []) {
      revalidatePath(path);
    }
    const target = typeof config.redirectTo === "string"
      ? config.redirectTo
      : config.redirectTo({ input: parsed.data, result });
    redirect(withNotice(target, config.success ?? "saved"));
  };
}
