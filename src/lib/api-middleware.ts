import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * CORS 中间件
 * 设置跨域响应头
 */
export function withCors<T extends NextRequest = NextRequest>(
  handler: (req: T) => Promise<NextResponse>,
  options: {
    /** 允许的源，默认全部允许 */
    allowedOrigins?: string[];
    /** 允许的方法 */
    allowedMethods?: string[];
    /** 允许的请求头 */
    allowedHeaders?: string[];
    /** 允许携带凭证 */
    allowCredentials?: boolean;
    /** 预检请求缓存时间（秒） */
    maxAge?: number;
  } = {}
): (req: T) => Promise<NextResponse> {
  return async (req: T) => {
    const origin = req.headers.get("origin");
    const {
      allowedOrigins = ["*"],
      allowedMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders = ["Content-Type", "Authorization"],
      allowCredentials = false,
      maxAge = 86400, // 24小时
    } = options;

    // 处理预检请求
    if (req.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 204 });

      if (allowedOrigins.includes("*")) {
        response.headers.set("Access-Control-Allow-Origin", "*");
      } else if (origin && allowedOrigins.includes(origin)) {
        response.headers.set("Access-Control-Allow-Origin", origin);
      }

      response.headers.set("Access-Control-Allow-Methods", allowedMethods.join(", "));
      response.headers.set("Access-Control-Allow-Headers", allowedHeaders.join(", "));
      response.headers.set("Access-Control-Max-Age", maxAge.toString());

      if (allowCredentials) {
        response.headers.set("Access-Control-Allow-Credentials", "true");
      }

      return response;
    }

    // 执行实际请求
    const response = await handler(req);

    // 添加 CORS 头
    if (allowedOrigins.includes("*")) {
      response.headers.set("Access-Control-Allow-Origin", "*");
    } else if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }

    response.headers.set("Access-Control-Allow-Methods", allowedMethods.join(", "));
    response.headers.set("Access-Control-Allow-Headers", allowedHeaders.join(", "));

    if (allowCredentials) {
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    return response;
  };
}

/**
 * Better Auth 认证中间件
 * 验证用户是否已登录
 */
export function withAuth<T extends NextRequest = NextRequest>(
  handler: (req: T, userId: string) => Promise<NextResponse>
): (req: T) => Promise<NextResponse> {
  return async (req: T) => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session?.user) {
        return NextResponse.json(
          { message: "Unauthorized" },
          { status: 401 }
        );
      }

      // 将 userId 传递给 handler
      return await handler(req, session.user.id);
    } catch (error) {
      // 开发环境记录错误（生产环境应使用结构化日志）
      console.error("Auth middleware error:", error);
      return NextResponse.json(
        { message: "Authentication failed" },
        { status: 401 }
      );
    }
  };
}

/**
 * 简单的内存速率限制器
 * 注意：生产环境应使用 Redis
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  /**
   * 检查速率限制
   * @param key - 限制键（通常是用户 ID 或 IP）
   * @param limit - 时间窗口内允许的请求数
   * @param windowMs - 时间窗口（毫秒），默认1小时
   */
  check(
    key: string,
    limit: number,
    windowMs: number = 3600000
  ): {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  } {
    const now = Date.now();
    const windowStart = now - windowMs;

    // 获取该键的请求记录
    let timestamps = this.requests.get(key) || [];

    // 清理过期的记录
    timestamps = timestamps.filter((ts) => ts > windowStart);

    // 检查是否超过限制
    if (timestamps.length >= limit) {
      // 计算重置时间
      const resetAt = new Date(timestamps[0] + windowMs);
      return { allowed: false, remaining: 0, resetAt };
    }

    // 记录本次请求
    timestamps.push(now);
    this.requests.set(key, timestamps);

    const resetAt = new Date(now + windowMs);
    return {
      allowed: true,
      remaining: limit - timestamps.length,
      resetAt,
    };
  }

  /** 重置某个键的限制 */
  reset(key: string) {
    this.requests.delete(key);
  }
}

// 全局限速器实例
const globalRateLimiter = new RateLimiter();

/**
 * 速率限制中间件
 */
export function withRateLimit<T extends NextRequest = NextRequest>(
  handler: (req: T) => Promise<NextResponse>,
  options?: {
    /** 每个时间窗口的请求数 */
    limit?: number;
    /** 时间窗口（毫秒） */
    windowMs?: number;
    /** 自定义限制键（默认使用 IP） */
    keyFn?: (req: T) => string;
  }
): (req: T) => Promise<NextResponse> {
  return async (req: T) => {
    const limit = options?.limit ?? 1000;

    // 使用自定义函数或 IP 作为限制键
    const key = options?.keyFn?.(req) ||
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "anonymous";

    const result = globalRateLimiter.check(key, limit, options?.windowMs);

    // 设置速率限制响应头
    const headers = {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": result.resetAt.toISOString(),
    };

    if (!result.allowed) {
      return NextResponse.json(
        { message: "Rate limit exceeded. Please try again later." },
        { status: 429, headers }
      );
    }

    const response = await handler(req);

    // 添加速率限制头到响应
    Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));

    return response;
  };
}

/**
 * 错误处理中间件
 * 捕获处理器中的错误并返回统一格式的响应
 */
export function withErrorHandler<T extends NextRequest = NextRequest>(
  handler: (req: T, ...args: any[]) => Promise<NextResponse>
): (req: T, ...args: any[]) => Promise<NextResponse> {
  return async (req: T, ...args: any[]) => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      // 开发环境记录错误（生产环境应使用结构化日志）
      console.error("API Error:", error);

      const message = error instanceof Error ? error.message : "Internal server error";

      return NextResponse.json(
        { message },
        { status: 500 }
      );
    }
  };
}

/**
 * 组合中间件
 * 一次性应用 CORS、认证、速率限制、错误处理
 */
export function withApiMiddleware<T extends NextRequest = NextRequest>(
  handler: (req: T, userId: string) => Promise<NextResponse>,
  options: {
    /** 是否需要认证 */
    requireAuth?: boolean;
    /** CORS 配置 */
    cors?: Parameters<typeof withCors>[1];
    /** 速率限制配置 */
    rateLimit?: Parameters<typeof withRateLimit>[1];
  } = {}
): (req: T) => Promise<NextResponse> {
  const { requireAuth = true } = options;

  // 组合中间件：CORS -> RateLimit -> Auth -> ErrorHandler
  let pipeline = handler;

  // 添加错误处理
  pipeline = withErrorHandler(pipeline) as any;

  // 添加认证
  if (requireAuth) {
    const originalHandler = pipeline;
    pipeline = ((req: T) => (originalHandler as any)(req)) as any;
    pipeline = withAuth(pipeline as any) as any;
  }

  // 添加速率限制
  if (options.rateLimit) {
    const originalHandler = pipeline;
    pipeline = ((req: T) => (originalHandler as any)(req)) as any;
    pipeline = withRateLimit(pipeline as any, options.rateLimit) as any;
  }

  // 添加 CORS
  if (options.cors) {
    const originalHandler = pipeline;
    pipeline = ((req: T) => (originalHandler as any)(req)) as any;
    pipeline = withCors(pipeline as any, options.cors) as any;
  }

  return pipeline;
}
