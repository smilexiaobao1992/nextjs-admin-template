import * as React from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export interface StatCardProps {
  label: string
  value: React.ReactNode
  detail?: React.ReactNode
  icon?: LucideIcon
  href?: string
  className?: string
}

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  href,
  className,
}: StatCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon aria-hidden="true" className="size-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-2.5 text-3xl font-semibold tabular-nums tracking-[-0.022em] text-foreground">
        {value}
      </p>
      {detail ? (
        <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
      ) : null}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "block rounded-xl bg-card p-5 text-card-foreground shadow-card transition-[transform,box-shadow] hover:shadow-card-raised active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        {content}
      </Link>
    )
  }

  return (
    <div
      className={cn(
        "rounded-xl bg-card p-5 text-card-foreground shadow-card",
        className,
      )}
    >
      {content}
    </div>
  )
}
