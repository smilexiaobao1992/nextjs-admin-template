import { SYSTEM_ADMIN_ROLE_KEY } from "@/lib/rbac/constants";

type SessionLike = {
  user?: {
    role?: string | null;
  } | null;
} | null;

export function isAdminSession(session: SessionLike): boolean {
  return session?.user?.role === SYSTEM_ADMIN_ROLE_KEY;
}

export function validateCredentialPassword(password: string): boolean {
  return password.length >= 12 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

export function safeRedirectPath(value: string | null | undefined): string {
  if (!value || /[\\\u0000-\u001F\u007F]/.test(value)) {
    return "/app";
  }

  try {
    const trustedOrigin = "https://admin-template.local";
    const url = new URL(value, trustedOrigin);

    if (url.origin !== trustedOrigin) {
      return "/app";
    }

    if (!url.pathname.startsWith("/")) {
      return "/app";
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/app";
  }
}

/** Build /login URL that returns the user to a safe local path after sign-in. */
export function buildLoginHref(nextPath?: string | null): string {
  const next = safeRedirectPath(nextPath);
  return `/login?next=${encodeURIComponent(next)}`;
}

export function canChangeRole({
  currentRole,
  nextRole,
  adminCount,
}: {
  currentRole: string;
  nextRole: string;
  adminCount: number;
}): boolean {
  return !(currentRole === SYSTEM_ADMIN_ROLE_KEY && nextRole !== SYSTEM_ADMIN_ROLE_KEY && adminCount <= 1);
}

export function canManageSystemRole({
  actorRole,
  currentRoleIsSystem,
  nextRoleIsSystem,
}: {
  actorRole: string;
  currentRoleIsSystem: boolean;
  nextRoleIsSystem: boolean;
}): boolean {
  if (!currentRoleIsSystem && !nextRoleIsSystem) {
    return true;
  }

  return actorRole === SYSTEM_ADMIN_ROLE_KEY;
}

export function canManageRolePermissionSets({
  actorPermissionIds,
  currentPermissionIds = [],
  nextPermissionIds,
}: {
  actorPermissionIds: string[];
  currentPermissionIds?: string[];
  nextPermissionIds: string[];
}): boolean {
  const actorPermissions = new Set(actorPermissionIds);
  return [...currentPermissionIds, ...nextPermissionIds].every((id) => actorPermissions.has(id));
}
