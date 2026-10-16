"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Layers,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/config/site";
import { ADMIN_THEME_COOKIE, type AdminTheme } from "@/lib/admin-theme";
import { authClient } from "@/lib/auth-client";
import { safeRedirectPath } from "@/lib/auth/authorization";
import { cn } from "@/lib/utils";
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

const ARCHITECTURAL_PILLARS = [
  {
    index: "01",
    title: "统一权限树",
    subtitle: "目录 · 页面 · 操作同源收敛",
    icon: Layers,
  },
  {
    index: "02",
    title: "事务级审计",
    subtitle: "业务写操作与留痕原子提交",
    icon: ShieldCheck,
  },
  {
    index: "03",
    title: "细粒度鉴权",
    subtitle: "多角色并集与越权边界防护",
    icon: KeyRound,
  },
] as const;

export default function LoginForm({
  nextPath,
  theme = "graphite",
}: {
  nextPath?: string;
  theme?: AdminTheme;
}) {
  const router = useRouter();
  const [activeTheme, setActiveTheme] = useState<AdminTheme>(theme);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function selectTheme(nextTheme: AdminTheme) {
    setActiveTheme(nextTheme);
    document.cookie = `${ADMIN_THEME_COOKIE}=${nextTheme}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }

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

  const isIndigo = activeTheme === "indigo";

  return (
    <main
      data-admin-theme={activeTheme}
      className="relative grid min-h-screen bg-background text-foreground selection:bg-primary/20 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)]"
    >
      {/* Left Panel: Generative Art Monolith */}
      <section
        className={cn(
          "relative hidden flex-col justify-between overflow-hidden p-10 text-stone-100 transition-colors duration-500 lg:m-3 lg:flex lg:rounded-2xl xl:p-14",
          isIndigo
            ? "bg-[#0c1021] shadow-[0_24px_80px_rgba(15,23,42,0.38)]"
            : "bg-[#151210] shadow-[0_24px_80px_rgba(28,22,18,0.36)]",
        )}
      >
        {/* Interactive Generative Topographic Canvas */}
        <DotWaveField
          theme={activeTheme}
          className="pointer-events-none absolute inset-0 size-full"
        />

        {/* Subtle Architectural Grid & Vignette Overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_75%_at_50%_45%,black_30%,transparent_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/65 via-black/25 to-transparent"
        />

        {/* Top Header: Brand Identity & Monograph Coordinate */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-white/15">
              <ShieldCheck aria-hidden="true" className="size-4" />
            </span>
            <div>
              <span className="block text-sm font-semibold tracking-tight text-white">
                {siteConfig.name}
              </span>
              <span className="block font-mono text-[10px] tracking-[0.2em] text-white/45 uppercase">
                ADMIN ARCHITECTURE
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] tracking-widest text-white/65 backdrop-blur-md">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]"
            />
            {isIndigo ? "INDIGO // 02" : "GRAPHITE // 01"}
          </div>
        </div>

        {/* Centerpiece Editorial Composition */}
        <div className="relative z-10 my-auto max-w-xl py-12">
          <div className="inline-flex items-center gap-2 rounded-md border border-white/12 bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
            <Sparkles aria-hidden="true" className="size-3.5 text-primary" />
            <span>Enterprise RBAC & Audit Foundation</span>
          </div>

          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.12] tracking-[-0.028em] text-white xl:text-[2.75rem]">
            {siteConfig.tagline}
          </h1>

          <p className="mt-5 max-w-md text-pretty text-base leading-7 text-white/65">
            {siteConfig.description}
            将动态菜单树、细粒度角色授权与数据库事务级审计融于一套克制而精密的工作台。
          </p>

          {/* Architectural 3-Column Spec Strip */}
          <div className="mt-10 grid grid-cols-3 gap-3">
            {ARCHITECTURAL_PILLARS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.index}
                  className="group rounded-xl border border-white/10 bg-white/[0.035] p-3.5 backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-white/40">
                      {item.index}
                    </span>
                    <Icon
                      aria-hidden="true"
                      className="size-3.5 text-primary/90"
                    />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-white/90">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/50">
                    {item.subtitle}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Footer: Coordinates & Copyright */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-5 text-xs text-white/45">
          <span>
            © {new Date().getFullYear()} {siteConfig.company}
          </span>
          <span className="font-mono text-[11px] tracking-wider">
            SESSION · ZERO-CACHE · STRICT
          </span>
        </div>
      </section>

      {/* Right Panel: Tactile Studio Form */}
      <section className="relative flex flex-col justify-between overflow-hidden px-6 py-8 sm:px-10 lg:px-14">
        {/* Subtle Dot Matrix Background on Form Side */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:20px_20px] opacity-45 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black_20%,transparent_100%)]"
        />

        {/* Top Bar: Mobile Brand + Live Theme Switcher */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 lg:hidden">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck aria-hidden="true" className="size-4" />
            </span>
            <span className="text-sm font-semibold">{siteConfig.name}</span>
          </div>

          <div
            role="group"
            aria-label="登录页主题"
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-border/80 bg-card/85 p-1 text-xs shadow-soft backdrop-blur-sm"
          >
            <button
              type="button"
              onClick={() => selectTheme("graphite")}
              aria-pressed={!isIndigo}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                !isIndigo
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-[#d96941]"
              />
              Graphite
            </button>
            <button
              type="button"
              onClick={() => selectTheme("indigo")}
              aria-pressed={isIndigo}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isIndigo
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-[#5850ec]"
              />
              Indigo
            </button>
          </div>
        </div>

        {/* Center Studio Login Card */}
        <div className="relative z-10 flex flex-1 items-center justify-center py-8">
          <div className="login-enter relative w-full max-w-[26rem]">
            {/* Sculpted Card Frame */}
            <div className="relative rounded-2xl border border-border/80 bg-card/95 p-7 shadow-card-raised backdrop-blur-md sm:p-9">
              {/* Subtle Top Accent Line */}
              <div
                aria-hidden="true"
                className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/55 to-transparent"
              />

              <div className="space-y-2">
                <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-primary uppercase">
                  AUTHENTICATION
                </p>
                <h2 className="text-2xl font-semibold tracking-[-0.02em]">
                  欢迎回来
                </h2>
                <p className="text-sm text-muted-foreground">
                  使用工作邮箱登录管理工作台
                </p>
              </div>

              <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
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
                    className="h-11 bg-background/55 transition-colors focus:bg-card"
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
                      placeholder="请输入至少 12 位登录密码"
                      className="h-11 bg-background/55 pr-11 transition-colors focus:bg-card"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "隐藏密码" : "显示密码"}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {showPassword ? (
                        <EyeOff aria-hidden="true" className="size-4" />
                      ) : (
                        <Eye aria-hidden="true" className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  className="group h-11 w-full gap-2 font-medium shadow-soft"
                  type="submit"
                  disabled={loading}
                >
                  <span>{loading ? "登录中…" : "登录"}</span>
                  {!loading ? (
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                    />
                  ) : null}
                </Button>
              </form>

              <div className="mt-7 border-t border-border/60 pt-5 text-center">
                <p className="text-xs text-muted-foreground">
                  没有账号或忘记密码？请联系系统管理员分配权限
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <p className="relative z-10 text-center text-xs text-muted-foreground lg:hidden">
          © {new Date().getFullYear()} {siteConfig.company}
        </p>
      </section>
    </main>
  );
}
