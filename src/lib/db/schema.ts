import {
  type AnyPgColumn,
  bigint,
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/** Application RBAC: dynamic roles, permissions, and menus. */

export const role = pgTable(
  "role",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    isSystem: boolean("is_system").notNull().default(false),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("role_single_default_idx")
      .on(table.isDefault)
      .where(sql`${table.isDefault} = true`),
  ],
);

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    /** Better Auth role keys, comma-separated for multi-role users. */
    role: text("role").notNull().default("member"),
    banned: boolean("banned").notNull().default(false),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "user_role_keys_format_check",
      sql`${table.role} ~ '^[a-z][a-z0-9_-]{1,63}(,[a-z][a-z0-9_-]{1,63})*$'`,
    ),
  ],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

export const MENU_NODE_TYPES = ["directory", "page", "action"] as const;
export type MenuNodeType = (typeof MENU_NODE_TYPES)[number];

/**
 * Unified navigation and permission tree.
 * directory: nav group; page: routable nav entry; action: operation permission (never in nav).
 */
export const menu = pgTable(
  "menu",
  {
    id: text("id").primaryKey(),
    parentId: text("parent_id").references((): AnyPgColumn => menu.id, { onDelete: "restrict" }),
    type: text("type", { enum: MENU_NODE_TYPES }).notNull().default("page"),
    title: text("title").notNull(),
    href: text("href").notNull().default(""),
    icon: text("icon"),
    sortOrder: integer("sort_order").notNull().default(0),
    /** Permission key granted by this node. Null on a page means any signed-in user may open it. */
    permissionKey: text("permission_key"),
    isVisible: boolean("is_visible").notNull().default(true),
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("menu_parent_id_idx").on(table.parentId),
    index("menu_sort_order_idx").on(table.sortOrder),
    uniqueIndex("menu_permission_key_idx")
      .on(table.permissionKey)
      .where(sql`${table.permissionKey} is not null`),
    check("menu_type_check", sql`${table.type} in ('directory', 'page', 'action')`),
    check(
      "menu_permission_key_by_type_check",
      sql`(${table.type} = 'directory' and ${table.permissionKey} is null)
        or (${table.type} = 'action' and ${table.permissionKey} is not null)
        or ${table.type} = 'page'`,
    ),
  ],
);

export const roleMenu = pgTable(
  "role_menu",
  {
    roleId: text("role_id")
      .notNull()
      .references(() => role.id, { onDelete: "cascade" }),
    menuId: text("menu_id")
      .notNull()
      .references(() => menu.id, { onDelete: "restrict" }),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.menuId] }),
    index("role_menu_menu_id_idx").on(table.menuId),
  ],
);

/** Append-only operational audit trail. Rows are never updated or deleted by app code. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    actorEmail: text("actor_email"),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id"),
    summary: text("summary").notNull(),
    metadata: text("metadata"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_log_created_at_idx").on(table.createdAt),
    index("audit_log_actor_user_id_idx").on(table.actorUserId),
    index("audit_log_action_idx").on(table.action),
    index("audit_log_resource_idx").on(table.resourceType, table.resourceId),
  ],
);

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Role = typeof role.$inferSelect;
export type Menu = typeof menu.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
