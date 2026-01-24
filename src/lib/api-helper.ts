import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getCurrentUserRole } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS, type Permission } from "@/lib/permissions/permissions";

/**
 * 扩展的 NextRequest 类型，包含用户信息
 */
export interface AuthenticatedRequest extends NextRequest {
  user: Awaited<ReturnType<typeof getCurrentUser>>;
}

/**
 * API 路由权限检查包装器
 * 自动处理用户认证和权限验证
 *
 * @param handler - API 处理函数
 * @param options - 配置选项
 * @returns 包装后的处理函数
 *
 * @example
 * ```typescript
 * // 简单认证
 * export const GET = withAuth(async (req) => {
 *   return NextResponse.json({ data: "..." });
 * });
 *
 * // 带权限检查
 * export const POST = withAuth(async (req) => {
 *   return NextResponse.json({ data: "..." });
 * }, { permission: PERMISSIONS.CUSTOMER_CREATE });
 *
 * // 动态路由（Next.js 15+）
 * export const GET = withAuth(async (req, context) => {
 *   const params = await context.params;
 *   return NextResponse.json({ id: params.id });
 * });
 * ```
 */
export function withAuth<
  T extends NextRequest = NextRequest,
  C = { params: Promise<Record<string, string>> },
>(
  handler: (req: T, context?: C) => Promise<NextResponse>,
  options: {
    /** 需要的权限，不传则只检查登录状态 */
    permission?: Permission;
  } = {}
): (req: T, context?: C) => Promise<NextResponse> {
  return async (req: T, context?: C) => {
    // 1. 检查用户是否登录
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    // 2. 如果需要特定权限，进行检查
    if (options.permission) {
      const userRole = await getCurrentUserRole() || "user";
      const hasAccess = await hasPermission(userRole, options.permission);
      if (!hasAccess) {
        return NextResponse.json({ message: "无权限访问此资源" }, { status: 403 });
      }
    }

    // 3. 将用户信息附加到 request，方便 handler 使用
    (req as unknown as AuthenticatedRequest).user = user;

    // 4. 执行实际的 handler
    try {
      return await handler(req, context);
    } catch (error) {
      // 统一错误处理
      console.error("API Error:", error);
      return NextResponse.json(
        { message: "服务器内部错误" },
        { status: 500 }
      );
    }
  };
}

/**
 * 错误响应辅助函数
 */
export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ message }, { status });
}

/**
 * 成功响应辅助函数
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * 从 request 中获取 body 并解析
 * 自动处理 JSON 解析错误
 */
export async function getRequestBody<T = Record<string, unknown>>(
  req: NextRequest
): Promise<{ data?: T; error?: string }> {
  try {
    const body = await req.json();
    return { data: body as T };
  } catch (error) {
    return { error: "请求数据格式错误" };
  }
}
