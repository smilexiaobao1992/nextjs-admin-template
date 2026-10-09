#!/usr/bin/env tsx
/**
 * Scaffold a complete, runnable CRUD feature domain under src/features and a protected route page.
 *
 * Usage:
 *   npm run scaffold:feature -- orders
 *   npm run scaffold:feature -- inventory-items
 */

import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const raw = args[0]?.trim();

if (!raw) {
  console.error("Usage: npm run scaffold:feature -- <feature-name>");
  process.exit(1);
}

if (!/^[a-z][a-z0-9-]*$/.test(raw)) {
  console.error("Feature name must be lowercase kebab-case, e.g. orders or inventory-items");
  process.exit(1);
}

const feature = raw;
const resource = feature.replace(/-/g, "_");
const pascal = feature
  .split("-")
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join("");
const title = feature
  .split("-")
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(" ");

const root = process.cwd();
const featureDir = join(root, "src/features", feature);
const componentsDir = join(featureDir, "components");
const pageDir = join(root, "src/app/app", feature);

if (existsSync(featureDir) || existsSync(pageDir)) {
  console.error(`Refusing to overwrite existing paths:\n  ${featureDir}\n  ${pageDir}`);
  process.exit(1);
}

mkdirSync(componentsDir, { recursive: true });
mkdirSync(pageDir, { recursive: true });

const messages = `export const ${resource}NoticeMessages: Record<string, string> = {
  created: "已创建。",
  updated: "已更新。",
  deleted: "已删除。",
  invalid_input: "请检查输入后重试。",
  not_found: "记录不存在，请刷新页面。",
  failed: "操作未完成，请稍后重试。",
};
`;

const schemaSnippet = `/**
 * Optional Drizzle schema snippet for ${pascal}.
 * Paste into src/lib/db/schema.ts, then run:
 *   npm run db:generate && npm run db:migrate
 */
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const ${resource} = pgTable("${resource}", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ${pascal}Item = typeof ${resource}.$inferSelect;
`;

const queries = `import { clampPage, type ParsedListQuery } from "@/lib/list/pagination";

export type ${pascal}Item = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
};

// In-memory demo data store. Replace with real Drizzle queries when connected to DB.
const mockItems: ${pascal}Item[] = [
  { id: "1", name: "示例记录 1", description: "这是一条演示数据", createdAt: new Date() },
  { id: "2", name: "示例记录 2", description: "支持列表搜索与分页", createdAt: new Date() },
];

export async function list${pascal}Page(query: ParsedListQuery) {
  // TODO: Replace with real db query like:
  // const where = query.q ? ilike(${resource}.name, "%" + escapeLikePattern(query.q) + "%") : undefined;
  // const [totalRow] = await db.select({ value: count() }).from(${resource}).where(where);
  const filtered = query.q
    ? mockItems.filter((i) => i.name.toLowerCase().includes(query.q.toLowerCase()))
    : mockItems;

  const total = filtered.length;
  const page = clampPage(query.page, total, query.pageSize);
  const offset = (page - 1) * query.pageSize;
  const items = filtered.slice(offset, offset + query.pageSize);

  return {
    items,
    total,
    page,
    pageSize: query.pageSize,
    q: query.q,
  };
}
`;

const actions = `"use server";

import { z } from "zod";
import { defineAction } from "@/lib/actions/define-action";
import { field } from "@/lib/actions/form";
import { writeAuditLog } from "@/lib/audit/persistence";
import { db } from "@/lib/db";

// Register these keys in 菜单与权限:
//   ${resource}:read   (页面节点，路径 /app/${feature})
//   ${resource}:create (操作节点)
//   ${resource}:update (操作节点)
//   ${resource}:delete (操作节点)

export const create${pascal}Action = defineAction({
  permission: "${resource}:create",
  schema: z.object({
    name: field.text({ max: 80 }),
    description: field.optionalText({ max: 500 }),
  }),
  redirectTo: "/app/${feature}",
  success: "created",
  revalidate: ["/app/${feature}"],
  handler: async ({ input, audit }) => {
    const id = crypto.randomUUID();
    // Keep mutation and audit log in one transaction:
    await db.transaction(async (tx) => {
      // TODO: await tx.insert(${resource}).values({ id, ...input });
      await writeAuditLog(
        await audit({
          action: "${resource}.create",
          resourceType: "${resource}",
          resourceId: id,
          summary: '创建 ${title} ' + input.name,
        }),
        tx,
      );
    });
  },
});

export const update${pascal}Action = defineAction({
  permission: "${resource}:update",
  schema: z.object({
    id: field.id(),
    name: field.text({ max: 80 }),
    description: field.optionalText({ max: 500 }),
  }),
  redirectTo: "/app/${feature}",
  success: "updated",
  revalidate: ["/app/${feature}"],
  handler: async ({ input, audit }) => {
    await db.transaction(async (tx) => {
      // TODO: await tx.update(${resource}).set(input).where(eq(${resource}.id, input.id));
      await writeAuditLog(
        await audit({
          action: "${resource}.update",
          resourceType: "${resource}",
          resourceId: input.id,
          summary: '更新 ${title} ' + input.name,
        }),
        tx,
      );
    });
  },
});

export const delete${pascal}Action = defineAction({
  permission: "${resource}:delete",
  schema: z.object({
    id: field.id(),
  }),
  redirectTo: "/app/${feature}",
  success: "deleted",
  revalidate: ["/app/${feature}"],
  handler: async ({ input, audit }) => {
    await db.transaction(async (tx) => {
      // TODO: await tx.delete(${resource}).where(eq(${resource}.id, input.id));
      await writeAuditLog(
        await audit({
          action: "${resource}.delete",
          resourceType: "${resource}",
          resourceId: input.id,
          summary: '删除 ${title} ' + input.id,
        }),
        tx,
      );
    });
  },
});
`;

const dialogComponent = `"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { create${pascal}Action, update${pascal}Action } from "../actions";
import type { ${pascal}Item } from "../queries";

export function ${pascal}Dialog({
  item,
  triggerLabel,
  mode = "create",
}: {
  item?: ${pascal}Item;
  triggerLabel?: string;
  mode?: "create" | "edit";
}) {
  const [open, setOpen] = useState(false);
  const isEdit = mode === "edit";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs">
            <Pencil aria-hidden="true" className="size-3.5" />
            {triggerLabel ?? "编辑"}
          </Button>
        ) : (
          <Button size="sm" className="gap-1.5">
            <Plus aria-hidden="true" className="size-4" />
            {triggerLabel ?? "新增"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form
          action={async (formData) => {
            if (isEdit) {
              await update${pascal}Action(formData);
            } else {
              await create${pascal}Action(formData);
            }
            setOpen(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>{isEdit ? "编辑 ${title}" : "新增 ${title}"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "修改已有记录的信息。" : "填写新记录的基本信息。"}
            </DialogDescription>
          </DialogHeader>

          {isEdit ? <input type="hidden" name="id" value={item?.id} /> : null}

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="${feature}-name">名称</Label>
              <Input
                id="${feature}-name"
                name="name"
                defaultValue={item?.name ?? ""}
                placeholder="请输入名称"
                required
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="${feature}-desc">描述</Label>
              <Input
                id="${feature}-desc"
                name="description"
                defaultValue={item?.description ?? ""}
                placeholder="可选描述说明"
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter>
            <SubmitButton pendingLabel="保存中…">{isEdit ? "保存变更" : "确认创建"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
`;

const listComponent = `import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { delete${pascal}Action } from "../actions";
import { ${pascal}Dialog } from "./${feature}-dialog";
import type { ${pascal}Item } from "../queries";

export function ${pascal}List({
  items,
  canUpdate,
  canDelete,
}: {
  items: ${pascal}Item[];
  canUpdate: boolean;
  canDelete: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-sm text-muted-foreground">
        暂无数据，请点击右上角新增。
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>名称</TableHead>
          <TableHead>描述</TableHead>
          <TableHead>创建时间</TableHead>
          {canUpdate || canDelete ? <TableHead className="text-right">操作</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell className="text-muted-foreground">{item.description ?? "—"}</TableCell>
            <TableCell className="tabular-nums text-muted-foreground">
              {formatDateTime(item.createdAt)}
            </TableCell>
            {canUpdate || canDelete ? (
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {canUpdate ? <${pascal}Dialog item={item} mode="edit" /> : null}
                  {canDelete ? (
                    <form action={delete${pascal}Action}>
                      <input type="hidden" name="id" value={item.id} />
                      <ConfirmSubmitButton
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        confirmTitle="确认删除"
                        confirmMessage={'确认删除记录"' + item.name + '"？此操作不可撤销。'}
                        confirmLabel="删除"
                      >
                        删除
                      </ConfirmSubmitButton>
                    </form>
                  ) : null}
                </div>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
`;

const page = `import { PageHeader } from "@/components/layout/page-header";
import { ListPagination } from "@/components/ui/list-pagination";
import { ListSearchForm } from "@/components/ui/list-search-form";
import { StatusNotice } from "@/components/ui/status-notice";
import { ${pascal}Dialog } from "@/features/${feature}/components/${feature}-dialog";
import { ${pascal}List } from "@/features/${feature}/components/${feature}-list";
import { ${resource}NoticeMessages } from "@/features/${feature}/messages";
import { list${pascal}Page } from "@/features/${feature}/queries";
import { can, requirePermission } from "@/lib/auth/session";
import { parseListQuery } from "@/lib/list/pagination";

export default async function ${pascal}Page({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; page?: string; q?: string; pageSize?: string }>;
}) {
  const session = await requirePermission("${resource}:read");
  const params = await searchParams;
  const listQuery = parseListQuery(params);

  const [data, canCreate, canUpdate, canDelete] = await Promise.all([
    list${pascal}Page(listQuery),
    can(session, "${resource}:create"),
    can(session, "${resource}:update"),
    can(session, "${resource}:delete"),
  ]);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="${title}"
        title="${pascal} 管理"
        description="业务数据管理列表。支持搜索、分页与操作权限隔离。"
        actions={canCreate ? <${pascal}Dialog /> : null}
      />

      <StatusNotice notice={params.notice} messages={${resource}NoticeMessages} />

      <div className="rounded-xl bg-card p-5 shadow-card">
        <ListSearchForm
          action="/app/${feature}"
          defaultQuery={listQuery.q}
          placeholder="按名称搜索…"
          label="搜索"
        />
      </div>

      <section
        aria-labelledby="${feature}-list-title"
        className="overflow-hidden rounded-xl bg-card shadow-card"
      >
        <div className="border-b border-border/70 px-5 py-4">
          <h2 id="${feature}-list-title" className="font-semibold">
            列表数据
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            共 <span className="tabular-nums">{data.total}</span> 条记录
          </p>
        </div>

        <${pascal}List
          items={data.items}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />

        <ListPagination
          pathname="/app/${feature}"
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          q={listQuery.q}
        />
      </section>
    </div>
  );
}
`;

const actionTest = `import { describe, expect, it } from "vitest";
import { ${resource}NoticeMessages } from "./messages";

describe("${pascal} messages", () => {
  it("provides standard notices", () => {
    expect(${resource}NoticeMessages.created).toBe("已创建。");
    expect(${resource}NoticeMessages.updated).toBe("已更新。");
    expect(${resource}NoticeMessages.deleted).toBe("已删除。");
  });
});
`;

writeFileSync(join(featureDir, "messages.ts"), messages);
writeFileSync(join(featureDir, "schema.snippet.ts"), schemaSnippet);
writeFileSync(join(featureDir, "queries.ts"), queries);
writeFileSync(join(featureDir, "actions.ts"), actions);
writeFileSync(join(componentsDir, `${feature}-dialog.tsx`), dialogComponent);
writeFileSync(join(componentsDir, `${feature}-list.tsx`), listComponent);
writeFileSync(join(featureDir, "actions.test.ts"), actionTest);
writeFileSync(join(pageDir, "page.tsx"), page);

console.log(`
✅ 业务脚手架生成完成: "${feature}"

文件清单:
  📁 src/features/${feature}/
     ├── messages.ts                   (提示文案)
     ├── schema.snippet.ts             (数据库表结构参考片段)
     ├── queries.ts                    (分页与搜索查询)
     ├── actions.ts                    (标准 Server Actions: create/update/delete)
     ├── actions.test.ts               (测试套件)
     └── components/
         ├── ${feature}-dialog.tsx      (新建/编辑弹窗组件)
         └── ${feature}-list.tsx        (数据表格与操作按钮)
  📁 src/app/app/${feature}/
     └── page.tsx                      (页面路由装配与权限校验)

下一步（在后台 UI 注册）:
  1. 打开后台「菜单与权限」页面 (http://localhost:3002/app/menus)
  2. 点击右上角「+ 页面」:
     - 名称: ${pascal}
     - 路径: /app/${feature}
     - 权限 key: ${resource}:read
     - 勾选: ☑️ 同时创建操作节点 (将自动生成 ${resource}:create, ${resource}:update, ${resource}:delete)
  3. 打开「角色管理」页面，为目标角色勾选「${pascal}」及其操作权限。
  4. (可选) 如需持久化到数据库，将 schema.snippet.ts 复制到 src/lib/db/schema.ts，并执行:
     npm run db:generate && npm run db:migrate
`);
