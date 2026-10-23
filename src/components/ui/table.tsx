import * as React from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { buildListHref, type SortOrder } from "@/lib/list/pagination"
import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm tabular-nums", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("bg-muted/45 [&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn("border-b border-border/70 transition-colors hover:bg-accent/55 data-[state=selected]:bg-accent", className)}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn("h-10 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableHead.displayName = "TableHead"

function SortableTableHead({
  column,
  currentSort,
  currentOrder = "desc",
  pathname,
  q = "",
  pageSize,
  children,
  className,
}: {
  column: string
  currentSort?: string
  currentOrder?: SortOrder
  pathname: string
  q?: string
  pageSize?: number
  children: React.ReactNode
  className?: string
}) {
  const isActive = currentSort === column
  const nextOrder: SortOrder = isActive
    ? currentOrder === "asc"
      ? "desc"
      : "asc"
    : "asc"
  const href = buildListHref(pathname, {
    page: 1,
    q,
    pageSize,
    sort: column,
    order: nextOrder,
  })
  const Icon = !isActive ? ArrowUpDown : currentOrder === "asc" ? ArrowUp : ArrowDown

  return (
    <TableHead
      aria-sort={isActive ? (currentOrder === "asc" ? "ascending" : "descending") : "none"}
      className={className}
    >
      <Link
        href={href}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md py-1 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive && "font-semibold text-foreground",
        )}
      >
        <span>{children}</span>
        <Icon
          aria-hidden="true"
          className={cn("size-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground/60")}
        />
      </Link>
    </TableHead>
  )
}

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  SortableTableHead,
  TableRow,
  TableCell,
  TableCaption,
}
