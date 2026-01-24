import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/index";
import { apiKey } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

/**
 * 扩展的 NextRequest 类型，包含 API Key 信息
 */
export interface ApiKeyRequest extends NextRequest {
  apiKey: Awaited<ReturnType<typeof validateApiKey>>["data"];
}

/**
 * 从请求头中提取 API Key
 * 支持两种方式：
 * 1. Authorization: Bearer sk_xxxxx
 * 2. X-API-Key: sk_xxxxx
 */
function extractApiKey(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  const xApiKey = req.headers.get("x-api-key");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return xApiKey;
}

/**
 * 验证 API Key
 * 检查：
 * 1. API Key 是否存在
 * 2. 状态是否为 active
 * 3. 是否未过期
 * 4. IP 白名单（如果配置）
 */
export async function validateApiKey(req: NextRequest) {
  const key = extractApiKey(req);

  if (!key) {
    return {
      valid: false,
      error: "Missing API key. Please provide X-API-Key header or Authorization: Bearer <key>",
    };
  }

  // 查询 API Key
  const keyRecord = await db.query.apiKey.findFirst({
    where: eq(apiKey.key, key),
    with: {
      user: {
        columns: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!keyRecord) {
    return { valid: false, error: "Invalid API key" };
  }

  // 检查状态
  if (keyRecord.status !== "active") {
    return { valid: false, error: `API key is ${keyRecord.status}` };
  }

  // 检查过期时间
  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
    // 自动标记为过期
    await db
      .update(apiKey)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(apiKey.id, keyRecord.id));
    return { valid: false, error: "API key has expired" };
  }

  // 检查 IP 白名单
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] ||
                   req.headers.get("x-real-ip") ||
                   "unknown";

  if (keyRecord.ipAddress) {
    const allowedIps = JSON.parse(keyRecord.ipAddress);
    if (!allowedIps.includes(clientIp) && !allowedIps.includes("*")) {
      return { valid: false, error: "IP address not allowed" };
    }
  }

  return {
    valid: true,
    data: {
      id: keyRecord.id,
      name: keyRecord.name,
      userId: keyRecord.userId,
      user: keyRecord.user,
      scopes: keyRecord.scopes || [],
      rateLimit: keyRecord.rateLimit || 1000,
    },
  };
}

/**
 * 生成随机 API Key
 * 格式: sk_<32位随机字符>
 */
export function generateApiKey(): { key: string; prefix: string } {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const randomBytes = Buffer.from(array).toString("base64url");
  const key = `sk_${randomBytes}`;
  const prefix = `sk_${randomBytes.substring(0, 8)}`;
  return { key, prefix };
}

/**
 * 生成 Webhook Secret
 * 格式: whsec_<32位随机字符>
 */
export function generateWebhookSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const randomBytes = Buffer.from(array).toString("base64url");
  return `whsec_${randomBytes}`;
}

/**
 * API Key 认证中间件
 * 自动验证 API Key 并附加到 request
 */
export function withApiKey<T extends NextRequest = NextRequest, C = any>(
  handler: (req: T, context?: C) => Promise<NextResponse>,
  options: {
    /** 需要的权限范围，如 ["orders:read"] */
    scopes?: string[];
  } = {}
): (req: T, context?: C) => Promise<NextResponse> {
  return async (req: T, context?: C) => {
    // 验证 API Key
    const validation = await validateApiKey(req);

    if (!validation.valid) {
      return NextResponse.json(
        { message: validation.error },
        { status: 401 }
      );
    }

    // 检查权限范围
    if (options.scopes && options.scopes.length > 0) {
      const hasScope = options.scopes.some(scope =>
        validation.data?.scopes.includes(scope) ||
        validation.data?.scopes.includes("*") // 通配符权限
      );

      if (!hasScope) {
        return NextResponse.json(
          { message: "Insufficient permissions. Required scopes: " + options.scopes.join(", ") },
          { status: 403 }
        );
      }
    }

    // 附加 API Key 信息到 request
    (req as unknown as ApiKeyRequest).apiKey = validation.data;

    // 更新最后使用时间（异步，不阻塞响应）
    if (validation.data?.id) {
      db.update(apiKey)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKey.id, validation.data.id))
        .catch(console.error);
    }

    try {
      return await handler(req, context);
    } catch (error) {
      console.error("API Error:", error);
      return NextResponse.json(
        { message: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

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
      allowedHeaders = ["Content-Type", "Authorization", "X-API-Key"],
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
 * 简单的内存速率限制器
 * 注意：生产环境应使用 Redis
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  /**
   * 检查速率限制
   * @param key - 限制键（通常是 API Key ID 或 IP）
   * @param limit - 时间窗口内允许的请求数
   * @param windowMs - 时间窗口（毫秒），默认1小时
   */
  check(key: string, limit: number, windowMs: number = 3600000): { allowed: boolean; remaining: number; resetAt: Date } {
    const now = Date.now();
    const windowStart = now - windowMs;

    // 获取该键的请求记录
    let timestamps = this.requests.get(key) || [];

    // 清理过期的记录
    timestamps = timestamps.filter(ts => ts > windowStart);

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
  }
): (req: T) => Promise<NextResponse> {
  return async (req: T) => {
    const apiKeyData = (req as unknown as ApiKeyRequest).apiKey;
    const limit = options?.limit ?? apiKeyData?.rateLimit ?? 1000;

    // 使用 API Key ID 或 IP 作为限制键
    const key = apiKeyData?.id || req.headers.get("x-forwarded-for")?.split(",")[0] || "anonymous";

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
 * 组合中间件
 * 一次性应用 CORS、API Key 认证、速率限制
 */
export function withApiMiddleware<T extends NextRequest = NextRequest>(
  handler: (req: T) => Promise<NextResponse>,
  options: {
    cors?: Parameters<typeof withCors>[1];
    apiKeyScopes?: string[];
    rateLimit?: Parameters<typeof withRateLimit>[1];
  } = {}
): (req: T) => Promise<NextResponse> {
  return withCors(
    withApiKey(
      withRateLimit(handler, options.rateLimit),
      { scopes: options.apiKeyScopes }
    ),
    options.cors
  );
}
