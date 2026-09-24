"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/config/site";
import type { AdminTheme } from "@/lib/admin-theme";
import { authClient } from "@/lib/auth-client";
import { safeRedirectPath } from "@/lib/auth/authorization";
import { DotWaveField } from "./dot-wave-field";

// Ban status is only reported after Better Auth has verified the password.
function loginErrorMessage(error: { status?: number; code?: string }): string {
  if (error.status === 429) {
    return "登录尝试过于频繁，请稍后再试。";
  }
  if (error.code === "BANNED_USER") {
    return "该账号已被停用，请联系管理员。";
  }
  return "邮箱或密码不正确，请重新输入。";
}

function BrandMark() {
  return (
    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <ShieldCheck aria-hidden="true" className="size-4" />
    </span>
  );
}

export default function LoginForm({ nextPath, theme = "graphite" }: { nextPath?: string; theme?: AdminTheme }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      const result = await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(loginErrorMessage(result.error));
        return;
      }

      toast.success("登录成功");
      router.push(safeRedirectPath(nextPath));
      router.refresh();
    } catch {
      setError("登录暂时不可用，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      data-admin-theme={theme}
      className="grid min-h-screen bg-card text-foreground lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      <section className="relative hidden flex-col overflow-hidden border-r border-border bg-background p-10 lg:flex xl:p-14">
        <DotWaveField className="pointer-events-none absolute inset-0 size-full [mask-image:linear-gradient(to_bottom,transparent_42%,black_62%,black_82%,transparent_93%)]" />

        <div className="relative flex items-center gap-2.5">
          <BrandMark />
          <span className="text-sm font-semibold">{siteConfig.name}</span>
        </div>

        <div className="relative mt-24 max-w-md xl:mt-32">
          <h1 className="text-balance text-3xl font-semibold tracking-[-0.022em] xl:text-4xl">
            {siteConfig.tagline}
          </h1>
          <p className="mt-4 text-pretty text-base leading-7 text-muted-foreground">
            {siteConfig.description}
          </p>
        </div>

        <p className="relative mt-auto text-xs text-muted-foreground">
          © {new Date().getFullYear()} {siteConfig.company}
        </p>
      </section>

      <section className="flex flex-col px-6 py-8 sm:px-10">
        <div className="flex items-center gap-2.5 lg:hidden">
          <BrandMark />
          <span className="text-sm font-semibold">{siteConfig.name}</span>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="login-enter w-full max-w-sm">
            <h2 className="text-2xl font-semibold tracking-[-0.018em]">欢迎回来</h2>
            <p className="mt-2 text-sm text-muted-foreground">使用工作邮箱登录</p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              {error ? (
                <p
                  role="alert"
                  aria-live="polite"
                  className="rounded-lg border border-destructive/30 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive"
                >
                  {error}
                </p>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  spellCheck={false}
                  required
                  autoFocus
                  placeholder="name@company.com"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="h-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {showPassword ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
                  </button>
                </div>
              </div>

              <Button className="h-11 w-full" type="submit" disabled={loading}>
                {loading ? "登录中…" : "登录"}
              </Button>
            </form>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              没有账号或忘记密码？请联系管理员
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground lg:hidden">
          © {new Date().getFullYear()} {siteConfig.company}
        </p>
      </section>
    </main>
  );
}
