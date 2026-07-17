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

export function isValidMenuParentSelection({
  menuId,
  parentId,
  parentParentId,
  menuHasChildren = false,
}: {
  menuId?: string | null;
  parentId: string | null;
  parentParentId: string | null;
  menuHasChildren?: boolean;
}): boolean {
  if (!parentId) {
    return true;
  }

  return !menuHasChildren && parentId !== menuId && parentParentId === null;
}

export function canBeDefaultRole({ isSystem }: { isSystem: boolean }): boolean {
  return !isSystem;
}
