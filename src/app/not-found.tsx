import Link from "next/link";
import { ArrowLeft, Compass, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-6 text-center text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative w-full max-w-md space-y-6 rounded-2xl border border-border/80 bg-card p-8 shadow-card-raised">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Compass aria-hidden="true" className="size-7" />
        </div>

        <div className="space-y-2.5">
          <Badge variant="outline" className="font-mono tabular-nums tracking-wider">
            404 NOT FOUND
          </Badge>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">
            找不到您访问的页面
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            该页面可能已被移动、下线，或您输入的访问地址有误。请检查链接或返回控制台继续操作。
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2 sm:flex-row sm:justify-center">
          <Button asChild className="gap-2">
            <Link href="/app">
              <Home aria-hidden="true" className="size-4" />
              返回工作台
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/">
              <ArrowLeft aria-hidden="true" className="size-4" />
              返回首页
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
