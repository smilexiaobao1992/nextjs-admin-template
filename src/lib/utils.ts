import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Server-rendered dates must not depend on the host time zone (UTC on Vercel). */
export const APP_TIME_ZONE = "Asia/Shanghai"

export function formatDate(value: Date) {
  return value.toLocaleDateString("zh-CN", { timeZone: APP_TIME_ZONE })
}

export function formatDateTime(value: Date) {
  return value.toLocaleString("zh-CN", { timeZone: APP_TIME_ZONE })
}
