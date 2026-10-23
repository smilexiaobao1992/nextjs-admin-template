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

/**
 * Parse a raw User-Agent string into a concise "Browser · OS" label
 * (e.g. `Chrome · macOS`, `Safari · iOS`, `Firefox · Windows`).
 */
export function formatUserAgent(userAgent: string | null | undefined): string {
  if (!userAgent) {
    return "未知设备"
  }
  const ua = userAgent.toLowerCase()

  let browser = "浏览器"
  if (ua.includes("edg/")) {
    browser = "Edge"
  } else if (ua.includes("opr/") || ua.includes("opera")) {
    browser = "Opera"
  } else if (ua.includes("chrome/") || ua.includes("crios/")) {
    browser = "Chrome"
  } else if (ua.includes("firefox/") || ua.includes("fxios/")) {
    browser = "Firefox"
  } else if (ua.includes("safari/")) {
    browser = "Safari"
  } else if (ua.includes("curl/")) {
    browser = "cURL"
  }

  let os = "未知系统"
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
    os = "iOS"
  } else if (ua.includes("android")) {
    os = "Android"
  } else if (ua.includes("mac os x") || ua.includes("macintosh")) {
    os = "macOS"
  } else if (ua.includes("windows")) {
    os = "Windows"
  } else if (ua.includes("linux")) {
    os = "Linux"
  }

  return `${browser} · ${os}`
}
