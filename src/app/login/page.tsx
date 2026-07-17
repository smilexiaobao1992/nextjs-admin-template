import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/lib/auth/authorization";
import { getSession } from "@/lib/auth/session";
import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const session = await getSession();

  if (session) {
    redirect(safeRedirectPath(next));
  }

  return <LoginForm nextPath={next} />;
}
