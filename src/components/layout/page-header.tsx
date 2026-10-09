import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Standard page heading: small eyebrow, h1 title, optional description and right-aligned actions.
 *
 *   <PageHeader eyebrow="订单" title="订单管理" description="…" actions={<Button>新建</Button>} />
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
        ) : null}
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.022em]">{title}</h1>
        {description ? <p className="mt-2 text-pretty text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
