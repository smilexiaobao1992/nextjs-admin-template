import Link from "next/link";
import { buildListHref, totalPages } from "@/lib/list/pagination";
import { cn } from "@/lib/utils";

export function ListPagination({
  pathname,
  page,
  pageSize,
  total,
  q = "",
}: {
  pathname: string;
  page: number;
  pageSize: number;
  total: number;
  q?: string;
}) {
  const pages = totalPages(total, pageSize);
  if (total === 0) {
    return null;
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const prevHref = buildListHref(pathname, { page: page - 1, q, pageSize });
  const nextHref = buildListHref(pathname, { page: page + 1, q, pageSize });

  return (
    <nav
      aria-label="分页"
      className="flex flex-col gap-3 border-t border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-muted-foreground">
        显示 <span className="tabular-nums text-foreground">{from}</span>
        {" – "}
        <span className="tabular-nums text-foreground">{to}</span>
        {" / "}
        <span className="tabular-nums text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <PaginationLink href={prevHref} disabled={page <= 1}>
          上一页
        </PaginationLink>
        <span className="min-w-16 text-center text-sm tabular-nums text-muted-foreground">
          {page} / {pages}
        </span>
        <PaginationLink href={nextHref} disabled={page >= pages}>
          下一页
        </PaginationLink>
      </div>
    </nav>
  );
}

function PaginationLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="inline-flex min-h-10 items-center rounded-lg border border-border/60 px-3 text-sm text-muted-foreground opacity-50">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-10 items-center rounded-lg border border-input/80 bg-card px-3 text-sm shadow-[0_1px_2px_rgba(62,47,35,0.08)] transition-[background-color,color,transform] hover:bg-accent hover:text-accent-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {children}
    </Link>
  );
}
