import type { MenuNodeType } from "@/lib/db/schema";
import { PERMISSION_KEY_PATTERN, ROLE_KEY_PATTERN } from "./constants";

export function isValidPermissionKey(value: string): boolean {
  return PERMISSION_KEY_PATTERN.test(value) && value.length <= 64;
}

export function isValidRoleKey(value: string): boolean {
  return ROLE_KEY_PATTERN.test(value) && value.length <= 64;
}

export function isSafeInternalHref(value: string): boolean {
  // Empty href is allowed for group parents (e.g. "系统设置") that only expand children.
  if (value === "") {
    return true;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return false;
  }

  if (/[\\\u0000-\u001F\u007F]/.test(value)) {
    return false;
  }

  try {
    const url = new URL(value, "https://admin-template.local");
    return url.origin === "https://admin-template.local";
  } catch {
    return false;
  }
}

/**
 * Tree rules: directory at root; page at root or under a directory;
 * action under a page or directory. Actions always carry a permission key,
 * directories never do, and only pages have a route.
 */
export function isValidMenuNode({
  type,
  parentType,
  permissionKey,
  href,
}: {
  type: MenuNodeType;
  parentType: MenuNodeType | null;
  permissionKey: string | null;
  href: string;
}): boolean {
  if (permissionKey !== null && !isValidPermissionKey(permissionKey)) {
    return false;
  }

  switch (type) {
    case "directory":
      return parentType === null && permissionKey === null && href === "";
    case "page":
      return (parentType === null || parentType === "directory") && href !== "" && isSafeInternalHref(href);
    case "action":
      return (parentType === "page" || parentType === "directory") && permissionKey !== null && href === "";
  }
}

export function canBeDefaultRole({ isSystem }: { isSystem: boolean }): boolean {
  return !isSystem;
}
