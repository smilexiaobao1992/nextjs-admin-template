/** Built-in system role key. Superuser shortcut for all permission checks. */
export const SYSTEM_ADMIN_ROLE_KEY = "admin";

/** Built-in default role for new credential users. */
export const DEFAULT_MEMBER_ROLE_KEY = "member";

/** Permission key pattern: resource:action (lowercase, digits, underscore, colon). */
export const PERMISSION_KEY_PATTERN = /^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$/;

/** Role key pattern: lowercase identifier. */
export const ROLE_KEY_PATTERN = /^[a-z][a-z0-9_-]{1,63}$/;
