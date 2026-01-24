import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// 需要认证的路由
const protectedRoutes = ["/app", "/dashboard"];
// 登录后不能访问的路由
const authRoutes = ["/login", "/register"];

export const runtime = "nodejs"; // 禁用 Edge Runtime

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;

  // 只在需要认证检查的路由上执行
  const isProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => nextUrl.pathname.startsWith(route));

  // 如果不是受保护路由也不是认证路由，直接跳过
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  // 获取 session - 使用 Better Auth 的 getSession
  let isLoggedIn = false;
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    isLoggedIn = !!session?.user;
  } catch (error) {
    console.error("Middleware auth error:", error);
    isLoggedIn = false;
  }

  // 未登录访问受保护路由 -> 重定向到登录页
  if (isProtectedRoute && !isLoggedIn) {
    const redirectUrl = new URL("/login", nextUrl);
    redirectUrl.searchParams.set("redirect", nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 已登录访问登录/注册页 -> 重定向到首页
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/app", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  // 只匹配需要认证检查的路由，避免在每个请求上都执行
  matcher: ["/app/:path*", "/dashboard/:path*", "/login/:path*", "/register/:path*"],
};
