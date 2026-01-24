import {
  pgTable,
  text,
  timestamp,
  uuid,
  decimal,
  integer,
  pgEnum,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

// ============================================
// Better Auth 认证系统核心表
// ============================================

// 用户角色枚举（示例）
export const userRoleEnum = pgEnum("user_role", ["admin", "user", "moderator"]);

// 用户表（better-auth 使用 user 表）
// 使用 snake_case 列名以符合 Drizzle/better-auth 最佳实践
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 账户表（better-auth 需要，用于存储密码和 OAuth 信息）
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 用户扩展信息表 (profiles) - 用于存储额外用户信息
export const profile = pgTable("profile", {
  id: text("id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  role: userRoleEnum("role").notNull().default("user"),
  bio: text("bio"), // 用户简介
  phone: text("phone"), // 联系电话
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 会话表（better-auth 需要）
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// 权限系统（示例）
// ============================================

// 权限枚举（示例）- 请根据实际业务需求扩展
export const permissionEnum = pgEnum("permission", [
  // 内容管理权限
  "content_view",
  "content_create",
  "content_update",
  "content_delete",

  // 用户管理权限
  "user_view",
  "user_create",
  "user_update",
  "user_delete",

  // 系统管理权限
  "system_view",
  "system_settings",
  "audit_log_view",
]);

// 角色权限关联表
export const rolePermission = pgTable("role_permission", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: userRoleEnum("role").notNull(),
  permission: permissionEnum("permission").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// 审计日志（示例）
// ============================================

// 操作日志枚举
export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "login",
  "logout",
  "export",
]);

// 操作资源类型枚举（示例）
export const auditResourceEnum = pgEnum("audit_resource", [
  "content",
  "user",
  "setting",
  "system",
]);

// 操作日志表（记录用户关键操作）
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  action: auditActionEnum("action").notNull(),
  resourceType: auditResourceEnum("resource_type").notNull(),
  resourceId: text("resource_id"),
  resourceName: text("resource_name"),
  details: jsonb("details").$type<{
    before?: Record<string, any>;
    after?: Record<string, any>;
    description?: string;
  }>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// 示例业务表结构
// ============================================

// 内容状态枚举（示例）
export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "published",
  "archived",
]);

// 示例：内容管理表
// 这是一个示例业务表，展示如何创建自己的业务模型
// 你可以根据实际需求删除或修改此表
export const contentItem = pgTable("content_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  status: contentStatusEnum("status").notNull().default("draft"),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  viewCount: integer("view_count").default(0),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"), // 软删除
});

// ============================================
// 类型导出
// ============================================

// 认证相关类型
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Profile = typeof profile.$inferSelect;
export type NewProfile = typeof profile.$inferInsert;
export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

// 权限相关类型
export type RolePermission = typeof rolePermission.$inferSelect;
export type NewRolePermission = typeof rolePermission.$inferInsert;

// 审计日志类型
export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;

// 示例业务类型
export type ContentItem = typeof contentItem.$inferSelect;
export type NewContentItem = typeof contentItem.$inferInsert;

// 枚举类型
export type UserRole = typeof userRoleEnum;
export type Permission = typeof permissionEnum;
export type AuditAction = typeof auditActionEnum;
export type AuditResource = typeof auditResourceEnum;
export type ContentStatus = typeof contentStatusEnum;
