"use client";

import { useState } from "react";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AdminTheme } from "@/lib/admin-theme";

const choices: Array<{
  value: AdminTheme;
  name: string;
  description: string;
  swatches: string[];
}> = [
  {
    value: "graphite",
    name: "Graphite Workspace",
    description: "石墨侧栏、暖白工作区与珊瑚主操作。",
    swatches: ["bg-[#262523]", "bg-[#f6f2ec]", "bg-[#fffdfa]", "bg-[#c94d26]"],
  },
  {
    value: "indigo",
    name: "Indigo Cloud",
    description: "亮色浮层侧栏、冷白画布与靛蓝主操作。",
    swatches: ["bg-white", "bg-[#f2f6fc]", "bg-[#dde5f1]", "bg-[#4967d8]"],
  },
];

export default function ThemeSwitcher({
  value,
  onChange,
}: {
  value: AdminTheme;
  onChange: (theme: AdminTheme) => void;
}) {
  const [open, setOpen] = useState(false);

  const selectTheme = (theme: AdminTheme) => {
    onChange(theme);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="切换界面主题" title="切换界面主题">
          <Palette aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>选择界面主题</DialogTitle>
          <DialogDescription>主题只改变界面外观，不影响菜单、权限和业务数据。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {choices.map((choice) => {
            const selected = choice.value === value;
            return (
              <button
                key={choice.value}
                type="button"
                aria-label={`使用 ${choice.name}`}
                aria-pressed={selected}
                onClick={() => selectTheme(choice.value)}
                className={cn(
                  "group relative min-h-40 rounded-xl border bg-card p-4 text-left shadow-[0_8px_24px_rgba(48,57,75,0.08)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[0_14px_30px_rgba(48,57,75,0.13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected && "border-primary ring-2 ring-primary/15",
                )}
              >
                <span className="mb-5 flex h-16 overflow-hidden rounded-lg border border-border/70">
                  <span className={cn("w-1/3", choice.swatches[0])} />
                  <span className={cn("flex-1", choice.swatches[1])}>
                    <span className={cn("mx-3 mt-3 block h-4 rounded", choice.swatches[2])} />
                    <span className={cn("mx-3 mt-2 block h-5 w-16 rounded", choice.swatches[3])} />
                  </span>
                </span>
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block text-sm font-semibold">{choice.name}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">{choice.description}</span>
                  </span>
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border text-primary opacity-0",
                      selected && "border-primary bg-primary/10 opacity-100",
                    )}
                  >
                    <Check aria-hidden="true" className="size-3.5" />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
