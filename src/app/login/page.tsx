import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_THEME_COOKIE, parseAdminTheme } from "@/lib/admin-theme";
import { safeRedirectPath } from "@/lib/auth/authorization";
import { getSession } from "@/lib/auth/session";
import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const [session, cookieStore] = await Promise.all([getSession(), cookies()]);

  if (session) {
    redirect(safeRedirectPath(next));
  }

  return <LoginForm nextPath={next} theme={parseAdminTheme(cookieStore.get(ADMIN_THEME_COOKIE)?.value)} />;
}
