"use client";

import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatDateTime } from "@/lib/utils";

export type AuditDetailItem = {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  summary: string;
  metadata: string | null;
  ipAddress: string | null;
  createdAt: Date;
};

function parseMetadataEntries(raw: string | null): [string, unknown][] {
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.entries(parsed as Record<string, unknown>);
    }
    return [["value", parsed]];
  } catch {
    return [["raw", raw]];
  }
}

function formatMetadataValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "是 (true)" : "否 (false)";
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? "[]" : value.map((item) => String(item)).join(", ");
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

export function AuditDetailSheet({ item }: { item: AuditDetailItem }) {
  const entries = parseMetadataEntries(item.metadata);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-xs"
          aria-label={`查看审计详情 ${item.summary}`}
        >
          <Eye aria-hidden="true" className="size-3.5" />
          详情
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {item.action}
            </Badge>
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatDateTime(item.createdAt)}
            </span>
          </div>
          <SheetTitle className="pt-1 text-base leading-snug">
            {item.summary}
          </SheetTitle>
          <SheetDescription>
            审计记录 ID：<span className="font-mono">{item.id}</span>
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <div className="space-y-5 text-sm">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              操作上下文
            </h3>
            <dl className="grid grid-cols-1 gap-3 rounded-xl bg-muted/45 p-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">操作人邮箱</dt>
                <dd className="mt-1 break-all font-medium">{item.actorEmail ?? "系统 / 未知"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">来源 IP</dt>
                <dd className="mt-1 font-mono text-xs tabular-nums">{item.ipAddress ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">资源类型</dt>
                <dd className="mt-1 font-mono text-xs">{item.resourceType}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">资源 ID</dt>
                <dd className="mt-1 break-all font-mono text-xs">{item.resourceId ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">操作人账号 ID</dt>
                <dd className="mt-1 break-all font-mono text-xs text-muted-foreground">
                  {item.actorUserId ?? "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              变更元数据 (Metadata)
            </h3>
            {entries.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/80 px-4 py-6 text-center text-xs text-muted-foreground">
                该操作未附加额外元数据字段。
              </p>
            ) : (
              <div className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/80 bg-background/60">
                {entries.map(([key, value]) => (
                  <div key={key} className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-3">
                    <span className="truncate font-mono text-xs text-muted-foreground" title={key}>
                      {key}
                    </span>
                    <span className="break-words font-mono text-xs text-foreground">
                      {formatMetadataValue(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
