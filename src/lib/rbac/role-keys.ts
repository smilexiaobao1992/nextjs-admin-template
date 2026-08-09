import { DEFAULT_MEMBER_ROLE_KEY, SYSTEM_ADMIN_ROLE_KEY } from "./constants";

export function parseRoleKeys(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  return [...new Set(value.split(",").map((key) => key.trim()).filter(Boolean))];
}

export function serializeRoleKeys(keys: string[]): string {
  const normalized = parseRoleKeys(keys.join(","));
  return (normalized.length > 0 ? normalized : [DEFAULT_MEMBER_ROLE_KEY]).join(",");
}

export function hasRoleKey(value: string | null | undefined, roleKey: string): boolean {
  return parseRoleKeys(value).includes(roleKey);
}

export function hasSystemAdminRole(value: string | null | undefined): boolean {
  return hasRoleKey(value, SYSTEM_ADMIN_ROLE_KEY);
}
