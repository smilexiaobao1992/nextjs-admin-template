export const ADMIN_THEME_COOKIE = "admin-theme-style";

export const adminThemes = ["graphite", "indigo"] as const;

export type AdminTheme = (typeof adminThemes)[number];

export function parseAdminTheme(value: string | null | undefined): AdminTheme {
  return value === "indigo" ? "indigo" : "graphite";
}
