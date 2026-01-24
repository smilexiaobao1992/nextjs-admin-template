/**
 * 统一的 API 错误处理
 */

import { NextResponse } from "next/server";
import type { ApiErrorResponse } from "@/types";

// ============== 错误类定义 ==============

/**
 * API 基础错误类
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 验证错误（400）
 */
export class ValidationError extends ApiError {
  constructor(
    message: string = "数据验证失败",
    public fields?: Record<string, string>
  ) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

/**
 * 未授权错误（401）
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = "未登录或登录已过期") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

/**
 * 禁止访问错误（403）
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = "无权限访问此资源") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

/**
 * 资源未找到错误（404）
 */
export class NotFoundError extends ApiError {
  constructor(resource: string = "资源") {
    super(`${resource}不存在`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

/**
 * 资源冲突错误（409）
 */
export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

/**
 * 业务逻辑错误（422）
 */
export class BusinessError extends ApiError {
  constructor(message: string) {
    super(message, 422, "BUSINESS_ERROR");
    this.name = "BusinessError";
  }
}

// ============== 错误处理函数 ==============

/**
 * 统一的 API 错误响应处理
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  // 记录错误日志
  console.error("API Error:", {
    name: error instanceof Error ? error.name : "Unknown",
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  // 已知的 API 错误
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          fields: error instanceof ValidationError ? error.fields : undefined,
        },
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode }
    );
  }

  // Zod 验证错误
  if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
    const zodError = error as { issues?: Array<{ path?: Array<unknown>; message: string }> };
    const fields: Record<string, string> = {};

    zodError.issues?.forEach((issue) => {
      const field = issue.path?.join(".") || "unknown";
      fields[field] = issue.message;
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          message: "数据验证失败",
          code: "VALIDATION_ERROR",
          statusCode: 400,
          fields,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // 数据库错误
  if (error instanceof Error && error.message.includes("unique constraint")) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "数据已存在，请检查是否重复创建",
          code: "DUPLICATE_ENTRY",
          statusCode: 409,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 409 }
    );
  }

  // 未知错误
  return NextResponse.json(
    {
      success: false,
      error: {
        message: "服务器内部错误",
        code: "INTERNAL_ERROR",
        statusCode: 500,
      },
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  );
}

/**
 * 快速创建错误响应的辅助函数
 */
export const apiErrors = {
  validation: (message?: string, fields?: Record<string, string>) =>
    new ValidationError(message, fields),
  unauthorized: (message?: string) => new UnauthorizedError(message),
  forbidden: (message?: string) => new ForbiddenError(message),
  notFound: (resource?: string) => new NotFoundError(resource),
  conflict: (message: string) => new ConflictError(message),
  business: (message: string) => new BusinessError(message),
};

// ============== 错误装饰器 ==============

/**
 * 包装异步函数，自动处理错误
 */
export function withErrorHandler<T extends (...args: unknown[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: unknown[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  }) as T;
}
