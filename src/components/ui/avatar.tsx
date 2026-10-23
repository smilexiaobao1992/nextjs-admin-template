import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-primary/12 font-semibold text-primary",
  {
    variants: {
      size: {
        sm: "size-8 text-xs",
        md: "size-10 text-sm",
        lg: "size-12 text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
)

export function getInitials(name: string): string {
  const cleaned = name.trim()
  if (!cleaned) {
    return "?"
  }
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase()
  }
  if (/[\u4e00-\u9fff]/.test(cleaned)) {
    return cleaned.charAt(0)
  }
  return cleaned.slice(0, 2).toUpperCase()
}

export interface AvatarProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof avatarVariants> {
  name: string
  src?: string | null
}

export function Avatar({ name, src, size, className, ...props }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(avatarVariants({ size }), className)}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </span>
  )
}
