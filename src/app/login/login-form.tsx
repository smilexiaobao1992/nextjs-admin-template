"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, KeyRound, Layers3, ShieldCheck, UserRound } from "lucide-react";
import { gsap } from "gsap";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { safeRedirectPath } from "@/lib/auth/authorization";

export default function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const rootRef = useRef<HTMLElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const context = gsap.context(() => {
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .from("[data-login-kicker]", { autoAlpha: 0, y: 14, duration: 0.45 })
        .from("[data-login-line]", { autoAlpha: 0, yPercent: 110, stagger: 0.08, duration: 0.7 }, "-=0.2")
        .from("[data-login-panel]", { opacity: 0, x: 24, duration: 0.6 }, 0.18);

      gsap.timeline({ delay: 0.58, defaults: { ease: "power3.out" } })
        .from("[data-access-map]", { opacity: 0, y: 18, duration: 0.55 }, "-=0.35")
        .from("[data-access-node]", { opacity: 0, y: 10, stagger: 0.08, duration: 0.4 }, "-=0.32")
        .from("[data-access-link]", { scaleX: 0, stagger: 0.12, duration: 0.5, transformOrigin: "left center" }, "-=0.3")
        .from("[data-access-permission]", { opacity: 0, x: -8, stagger: 0.06, duration: 0.35 }, "-=0.28");

      gsap.to("[data-access-signal]", {
        x: (_, element) => Math.max((element.parentElement?.clientWidth ?? 6) - 6, 0),
        duration: 2.2,
        ease: "power1.inOut",
        repeat: -1,
        repeatDelay: 0.65,
        repeatRefresh: true,
        stagger: 0.18,
      });
      gsap.timeline({ repeat: -1, repeatDelay: 0.9 })
        .to("[data-access-step]", { opacity: 1, stagger: 0.22, duration: 0.28, ease: "power2.out" })
        .to("[data-access-step]", { opacity: 0.48, stagger: 0.16, duration: 0.36, ease: "power2.inOut" }, "+=0.5");

      gsap.to("[data-signal-dot]", {
        x: 176,
        duration: 2.8,
        ease: "none",
        repeat: -1,
      });
      gsap.to("[data-status-ring]", {
        rotate: 360,
        duration: 12,
        ease: "none",
        repeat: -1,
        transformOrigin: "center",
      });
    }, rootRef);

    return () => context.revert();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches && submitRef.current) {
      gsap.fromTo(submitRef.current, { scale: 0.985 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
    }

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      const result = await authClient.signIn.email({ email, password });

      if (result.error) {
        setError("邮箱或密码不正确，请重新输入。");
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
    <main ref={rootRef} data-admin-theme="graphite" className="min-h-screen bg-background p-2 text-foreground sm:p-3 lg:p-4">
      <div className="mx-auto grid min-h-[calc(100vh-1rem)] max-w-[1600px] overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_24px_80px_rgba(62,47,35,0.14)] sm:min-h-[calc(100vh-1.5rem)] lg:min-h-[calc(100vh-2rem)] lg:grid-cols-[minmax(0,1.08fr)_minmax(28rem,0.92fr)]">
        <section className="relative overflow-hidden bg-primary px-6 py-7 text-primary-foreground sm:px-9 sm:py-9 lg:flex lg:min-h-[720px] lg:flex-col lg:justify-between lg:px-14 lg:py-12 xl:px-20 xl:py-16">
          <div className="relative z-10 flex items-center justify-between">
            <div data-login-kicker className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-primary-foreground/75">
              <KeyRound aria-hidden="true" className="size-3.5" />
              管理中心
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-primary-foreground/75">
              <span className="size-1.5 rounded-full bg-primary-foreground/90" />
              系统登录
            </div>
          </div>

          <div className="relative z-10 mt-14 max-w-xl lg:mt-20">
            <p data-login-kicker className="mb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-primary-foreground/70">
              ACCESS CONTROL
            </p>
            <h1 className="text-balance text-[clamp(2.5rem,4.4vw,4.6rem)] font-semibold leading-[0.96] tracking-[-0.05em]">
              <span className="block overflow-hidden pb-2"><span data-login-line className="block">账号与权限管理</span></span>
            </h1>
            <p className="mt-5 max-w-md text-pretty text-sm leading-7 text-primary-foreground/72 sm:text-base">
              一个账号可以关联多个角色，系统根据角色权限显示对应功能。
            </p>
          </div>

          <div data-access-map className="relative z-10 mt-12 hidden max-w-2xl sm:block lg:mt-16">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-primary-foreground/55">
              <span>访问关系</span>
              <span className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary-foreground/85" />
                权限已载入
              </span>
            </div>

            <div className="mt-5 grid grid-cols-[7.5rem_minmax(2rem,1fr)_8.5rem_minmax(2rem,1fr)_7rem] items-center gap-3">
              <div data-access-node className="bg-primary-foreground/10 px-4 py-4 shadow-[0_12px_30px_rgba(76,31,20,0.1)]">
                <UserRound aria-hidden="true" className="size-4 text-primary-foreground/70" />
                <p className="mt-5 text-[10px] text-primary-foreground/55">账号</p>
                <p className="mt-1 text-sm font-medium">当前用户</p>
              </div>

              <div data-access-link aria-hidden="true" className="relative h-px bg-primary-foreground/28">
                <span data-access-signal className="absolute -top-0.5 left-0 size-1.5 rounded-full bg-primary-foreground shadow-[0_0_0_4px_rgba(255,248,239,0.12)]" />
              </div>

              <div data-access-node className="bg-primary-foreground/10 px-4 py-4 shadow-[0_12px_30px_rgba(76,31,20,0.1)]">
                <Layers3 aria-hidden="true" className="size-4 text-primary-foreground/70" />
                <p className="mt-5 text-[10px] text-primary-foreground/55">角色</p>
                <p className="mt-1 text-sm font-medium">多角色</p>
              </div>

              <div data-access-link aria-hidden="true" className="relative h-px bg-primary-foreground/28">
                <span data-access-signal className="absolute -top-0.5 left-0 size-1.5 rounded-full bg-primary-foreground shadow-[0_0_0_4px_rgba(255,248,239,0.12)]" />
              </div>

              <div data-access-node className="space-y-2.5">
                {['用户', '角色', '审计'].map((item) => (
                  <div data-access-permission key={item} className="flex items-center gap-2 text-xs text-primary-foreground/78">
                    <span className="size-1 rounded-full bg-primary-foreground/70" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.14em] text-primary-foreground/50">
              <span data-access-step className="opacity-50">身份校验</span>
              <span className="h-px flex-1 bg-primary-foreground/18" />
              <span data-access-step className="opacity-50">角色加载</span>
              <span className="h-px flex-1 bg-primary-foreground/18" />
              <span data-access-step className="opacity-50">权限生效</span>
            </div>
          </div>
        </section>

        <section data-login-panel className="flex items-center justify-center bg-card px-6 py-12 sm:px-10 lg:px-14 xl:px-24">
          <div className="w-full max-w-[430px]">
            <div className="mb-12 flex items-center justify-between border-b border-border pb-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">ADMIN SYSTEM</p>
                <p className="mt-1 text-sm font-medium">管理中心</p>
              </div>
              <div className="relative grid size-11 place-items-center rounded-full border border-primary/20 text-primary">
                <svg data-status-ring aria-hidden="true" viewBox="0 0 44 44" className="absolute inset-0 size-full text-primary/45">
                  <circle cx="22" cy="22" r="20" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="7 8" />
                </svg>
                <ShieldCheck aria-hidden="true" className="size-4" />
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">账号登录</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-[2.75rem]">登录管理中心</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">请输入工作邮箱和密码。</p>
            </div>

            <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
              {error ? (
                <p role="alert" aria-live="polite" className="border-l-2 border-destructive bg-destructive/8 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              ) : null}

              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-xs font-medium text-foreground/75">工作邮箱</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  spellCheck={false}
                  required
                  autoFocus
                  placeholder="name@example.com"
                  className="h-12 rounded-none border-x-0 border-t-0 border-input bg-transparent px-0 text-base shadow-none focus-visible:border-primary focus-visible:ring-0"
                />
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="password" className="text-xs font-medium text-foreground/75">密码</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="h-12 rounded-none border-x-0 border-t-0 border-input bg-transparent px-0 text-base shadow-none focus-visible:border-primary focus-visible:ring-0"
                />
              </div>

              <Button
                ref={submitRef}
                className="group h-12 w-full rounded-none px-5 shadow-none"
                type="submit"
                disabled={loading}
              >
                <span>{loading ? "验证中…" : "安全登录"}</span>
                {!loading ? <ArrowRight aria-hidden="true" className="ml-auto size-4 transition-transform group-hover:translate-x-1" /> : null}
              </Button>
            </form>

            <div className="mt-10 flex items-center justify-between border-t border-border pt-5 text-[11px] text-muted-foreground">
              <span>如需开通账号或重置密码，请联系系统管理员</span>
              <span className="flex items-center gap-1.5 font-mono uppercase tracking-[0.12em]">
                <Activity aria-hidden="true" className="size-3" /> 在线
              </span>
            </div>

            <div aria-hidden="true" className="mt-7 h-px w-44 overflow-hidden bg-primary/15">
              <span data-signal-dot className="block size-1 -translate-y-[1.5px] rounded-full bg-primary" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
