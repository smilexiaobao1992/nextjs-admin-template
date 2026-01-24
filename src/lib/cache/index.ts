// 缓存配置
export const CACHE_TTL = 5 * 60; // 5 分钟（秒）

// 缓存类型
export type CacheType = "memory" | "redis";

// 获取缓存类型（从环境变量读取，默认 memory）
export function getCacheType(): CacheType {
  return (process.env.CACHE_TYPE as CacheType) || "memory";
}

// 缓存接口
export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

// 内存缓存实现
class MemoryCache implements ICache {
  private cache = new Map<string, { value: any; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set(key: string, value: any, ttl: number = CACHE_TTL): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

// Redis 缓存实现（使用 Upstash）
class RedisCache implements ICache {
  private client: any;
  private initialized = false;

  private async init() {
    if (this.initialized) return;

    try {
      const { Redis } = await import("@upstash/redis");
      this.client = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL || "",
        token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
      });
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize Redis:", error);
      throw new Error("Redis configuration is missing or invalid");
    }
  }

  async get<T>(key: string): Promise<T | null> {
    await this.init();
    try {
      const value = await this.client.get(key);
      return value as T;
    } catch (error) {
      console.error("Redis get error:", error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = CACHE_TTL): Promise<void> {
    await this.init();
    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error("Redis set error:", error);
    }
  }

  async delete(key: string): Promise<void> {
    await this.init();
    try {
      await this.client.del(key);
    } catch (error) {
      console.error("Redis delete error:", error);
    }
  }

  async clear(): Promise<void> {
    await this.init();
    try {
      // 获取所有带前缀的 key 并删除
      const keys = await this.client.keys("*");
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      console.error("Redis clear error:", error);
    }
  }

  async has(key: string): Promise<boolean> {
    await this.init();
    try {
      const value = await this.client.exists(key);
      return value === 1;
    } catch (error) {
      console.error("Redis has error:", error);
      return false;
    }
  }
}

// 缓存工厂函数
let cacheInstance: ICache | null = null;

export function getCache(): ICache {
  if (!cacheInstance) {
    const cacheType = getCacheType();

    if (cacheType === "redis") {
      console.log("🔴 Using Redis cache (Upstash)");
      cacheInstance = new RedisCache();
    } else {
      console.log("💾 Using in-memory cache");
      cacheInstance = new MemoryCache();
    }
  }

  return cacheInstance;
}

// 重置缓存实例（用于测试或配置变更）
export function resetCacheInstance() {
  cacheInstance = null;
}
