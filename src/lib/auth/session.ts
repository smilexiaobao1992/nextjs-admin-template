import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { profile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCache } from "@/lib/cache";

// Session 数据接口
interface SessionData {
  user: any;
  session: any;
}

export async function getSession() {
  const cache = getCache();
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("better-auth.session_token")?.value;

  if (!sessionToken) {
    return null;
  }

  // 检查缓存
  const cacheKey = `session:${sessionToken}`;
  const cached = await cache.get<SessionData>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // 使用 Better Auth 的 getSession，会自动利用 cookieCache
    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: `better-auth.session_token=${sessionToken}`,
      }),
    });

    if (session) {
      // 存入缓存
      await cache.set(cacheKey, session);
    }

    return session;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

export async function getCurrentUserRole() {
  const cache = getCache();
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  // 检查角色缓存
  const cacheKey = `role:${user.id}`;
  const cached = await cache.get<string>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const userProfile = await db
      .select({ role: profile.role })
      .from(profile)
      .where(eq(profile.id, user.id))
      .limit(1);

    const role = userProfile[0]?.role || "user";

    // 存入缓存
    await cache.set(cacheKey, role);

    return role;
  } catch {
    return "user";
  }
}

// 登出时清除缓存
export async function clearSessionCache(sessionToken?: string) {
  const cache = getCache();

  if (sessionToken) {
    await cache.delete(`session:${sessionToken}`);
  } else {
    await cache.clear();
  }
}
