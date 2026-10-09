"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    console.error("[AppError]", error);
  }, [error]);

  const handleRetry = () => {
    if (typeof retry === "function") {
      retry();
    } else if (typeof reset === "function") {
      reset();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <div className="rounded-2xl bg-card p-8 shadow-card max-w-md w-full space-y-5">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <AlertCircle aria-hidden="true" className="size-6" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-[-0.015em]">页面加载遇到问题</h2>
          <p className="text-sm text-muted-foreground">
            发生了未预期的错误，请尝试刷新当前页面或返回工作台。
          </p>
          {error.digest ? (
            <p className="font-mono text-xs text-muted-foreground/80">错误标识: {error.digest}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center pt-2">
          <Button onClick={handleRetry} className="gap-2">
            <RefreshCw aria-hidden="true" className="size-4" />
            重试
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/app">
              <Home aria-hidden="true" className="size-4" />
              返回工作台
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
