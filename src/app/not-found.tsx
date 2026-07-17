import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.022em]">页面不存在</h1>
        <p className="mt-3 text-muted-foreground">链接可能已失效，或者你没有可访问的对应页面。</p>
        <Button asChild className="mt-6">
          <Link href="/app">返回工作台</Link>
        </Button>
      </div>
    </main>
  );
}
