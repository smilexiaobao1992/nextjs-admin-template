import { db } from "@/lib/db/index";
import { rolePermission, type permissionEnum } from "@/lib/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

export type Permission = "order_view" | "order_create" | "order_update" | "order_delete" | "order_export"
  | "batch_view" | "batch_create" | "batch_update" | "batch_delete"
  | "customer_view" | "customer_create" | "customer_update" | "customer_delete" | "customer_contact_log"
  | "user_view" | "user_create" | "user_update" | "user_delete"
  | "system_view" | "system_settings" | "audit_log_view";

/**
 * 权限常量 - 方便代码中使用
 */
export const PERMISSIONS = {
  // 订单相关
  ORDER_VIEW: "order_view",
  ORDER_CREATE: "order_create",
  ORDER_UPDATE: "order_update",
  ORDER_DELETE: "order_delete",
  ORDER_EXPORT: "order_export",

  // 批次相关
  BATCH_VIEW: "batch_view",
  BATCH_CREATE: "batch_create",
  BATCH_UPDATE: "batch_update",
  BATCH_DELETE: "batch_delete",

  // 客户相关
  CUSTOMER_VIEW: "customer_view",
  CUSTOMER_CREATE: "customer_create",
  CUSTOMER_UPDATE: "customer_update",
  CUSTOMER_DELETE: "customer_delete",
  CUSTOMER_CONTACT_LOG: "customer_contact_log",

  // 用户相关
  USER_VIEW: "user_view",
  USER_CREATE: "user_create",
  USER_UPDATE: "user_update",
  USER_DELETE: "user_delete",

  // 系统相关
  SYSTEM_VIEW: "system_view",
  SYSTEM_SETTINGS: "system_settings",
  AUDIT_LOG_VIEW: "audit_log_view",
} as const;

/**
 * 默认角色权限配置
 */
const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    // Admin 拥有所有权限
    ...Object.values(PERMISSIONS),
  ],
  user: [
    // 普通用户权限
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.BATCH_VIEW,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.SYSTEM_VIEW,
  ],
};

/**
 * 获取角色的所有权限
 */
export async function getRolePermissions(role: string): Promise<Permission[]> {
  try {
    // 先查询数据库中配置的权限
    const dbPermissions = await db
      .select({ permission: rolePermission.permission })
      .from(rolePermission)
      .where(eq(rolePermission.role, role as any));

    // 如果数据库中有配置，返回数据库配置
    if (dbPermissions.length > 0) {
      return dbPermissions.map((p) => p.permission as Permission);
    }

    // 否则返回默认权限
    return DEFAULT_ROLE_PERMISSIONS[role] || [];
  } catch (error) {
    // 表可能不存在或其他数据库错误，返回默认权限
    console.error("Failed to get role permissions from DB, using defaults:", error);
    return DEFAULT_ROLE_PERMISSIONS[role] || [];
  }
}

/**
 * 检查角色是否拥有指定权限
 */
export async function hasPermission(
  role: string,
  permission: Permission
): Promise<boolean> {
  const permissions = await getRolePermissions(role);
  return permissions.includes(permission);
}

/**
 * 检查角色是否拥有任一权限
 */
export async function hasAnyPermission(
  role: string,
  permissions: Permission[]
): Promise<boolean> {
  const rolePermissions = await getRolePermissions(role);
  return permissions.some((p) => rolePermissions.includes(p));
}

/**
 * 检查角色是否拥有所有权限
 */
export async function hasAllPermissions(
  role: string,
  permissions: Permission[]
): Promise<boolean> {
  const rolePermissions = await getRolePermissions(role);
  return permissions.every((p) => rolePermissions.includes(p));
}

/**
 * 为角色设置权限（替换现有权限）
 */
export async function setRolePermissions(
  role: string,
  permissions: Permission[]
): Promise<void> {
  try {
    // 删除角色现有权限
    await db.delete(rolePermission).where(eq(rolePermission.role, role as any));

    // 插入新权限
    if (permissions.length > 0) {
      await db.insert(rolePermission).values(
        permissions.map((permission) => ({
          role: role as any,
          permission: permission as any,
        }))
      );
    }
  } catch (error) {
    console.error("Failed to set role permissions:", error);
    throw error;
  }
}

/**
 * 为角色添加权限
 */
export async function addRolePermissions(
  role: string,
  permissions: Permission[]
): Promise<void> {
  try {
    const existingPermissions = await getRolePermissions(role);
    const newPermissions = permissions.filter(
      (p) => !existingPermissions.includes(p)
    );

    if (newPermissions.length > 0) {
      await db.insert(rolePermission).values(
        newPermissions.map((permission) => ({
          role: role as any,
          permission: permission as any,
        }))
      );
    }
  } catch (error) {
    console.error("Failed to add role permissions:", error);
    throw error;
  }
}

/**
 * 从角色移除权限
 */
export async function removeRolePermissions(
  role: string,
  permissions: Permission[]
): Promise<void> {
  try {
    if (permissions.length === 0) {
      return;
    }
    // 删除指定的权限
    await db
      .delete(rolePermission)
      .where(
        and(
          eq(rolePermission.role, role as any),
          inArray(rolePermission.permission, permissions as any[])
        )
      );
  } catch (error) {
    console.error("Failed to remove role permissions:", error);
    throw error;
  }
}

/**
 * 获取所有权限的中文名称映射
 */
export const PERMISSION_LABELS: Record<Permission, string> = {
  [PERMISSIONS.ORDER_VIEW]: "查看订单",
  [PERMISSIONS.ORDER_CREATE]: "创建订单",
  [PERMISSIONS.ORDER_UPDATE]: "修改订单",
  [PERMISSIONS.ORDER_DELETE]: "删除订单",
  [PERMISSIONS.ORDER_EXPORT]: "导出订单",

  [PERMISSIONS.BATCH_VIEW]: "查看批次",
  [PERMISSIONS.BATCH_CREATE]: "创建批次",
  [PERMISSIONS.BATCH_UPDATE]: "修改批次",
  [PERMISSIONS.BATCH_DELETE]: "删除批次",

  [PERMISSIONS.CUSTOMER_VIEW]: "查看客户",
  [PERMISSIONS.CUSTOMER_CREATE]: "创建客户",
  [PERMISSIONS.CUSTOMER_UPDATE]: "修改客户",
  [PERMISSIONS.CUSTOMER_DELETE]: "删除客户",
  [PERMISSIONS.CUSTOMER_CONTACT_LOG]: "联系记录管理",

  [PERMISSIONS.USER_VIEW]: "查看用户",
  [PERMISSIONS.USER_CREATE]: "创建用户",
  [PERMISSIONS.USER_UPDATE]: "修改用户",
  [PERMISSIONS.USER_DELETE]: "删除用户",

  [PERMISSIONS.SYSTEM_VIEW]: "查看系统信息",
  [PERMISSIONS.SYSTEM_SETTINGS]: "系统设置",
  [PERMISSIONS.AUDIT_LOG_VIEW]: "查看操作日志",
};

/**
 * 权限分组 - 用于权限管理页面展示
 */
export const PERMISSION_GROUPS = {
  order: {
    label: "订单管理",
    permissions: [
      PERMISSIONS.ORDER_VIEW,
      PERMISSIONS.ORDER_CREATE,
      PERMISSIONS.ORDER_UPDATE,
      PERMISSIONS.ORDER_DELETE,
      PERMISSIONS.ORDER_EXPORT,
    ],
  },
  batch: {
    label: "批次管理",
    permissions: [
      PERMISSIONS.BATCH_VIEW,
      PERMISSIONS.BATCH_CREATE,
      PERMISSIONS.BATCH_UPDATE,
      PERMISSIONS.BATCH_DELETE,
    ],
  },
  customer: {
    label: "客户管理",
    permissions: [
      PERMISSIONS.CUSTOMER_VIEW,
      PERMISSIONS.CUSTOMER_CREATE,
      PERMISSIONS.CUSTOMER_UPDATE,
      PERMISSIONS.CUSTOMER_DELETE,
      PERMISSIONS.CUSTOMER_CONTACT_LOG,
    ],
  },
  user: {
    label: "用户管理",
    permissions: [
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.USER_DELETE,
    ],
  },
  system: {
    label: "系统管理",
    permissions: [
      PERMISSIONS.SYSTEM_VIEW,
      PERMISSIONS.SYSTEM_SETTINGS,
      PERMISSIONS.AUDIT_LOG_VIEW,
    ],
  },
};
