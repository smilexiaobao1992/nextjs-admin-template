#!/usr/bin/env tsx
/**
 * Scaffold a thin feature domain under src/features and a protected route page.
 *
 * Usage:
 *   npm run scaffold:feature -- orders
 *   npm run scaffold:feature -- inventory-items
 */

import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const raw = process.argv[2]?.trim();

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
  .map((part) => part)
  .join(" ");

const root = process.cwd();
const featureDir = join(root, "src/features", feature);
const pageDir = join(root, "src/app/app", feature);

if (existsSync(featureDir) || existsSync(pageDir)) {
  console.error(`Refusing to overwrite existing paths:\n  ${featureDir}\n  ${pageDir}`);
  process.exit(1);
}

mkdirSync(featureDir, { recursive: true });
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

const queries = `import { db } from "@/lib/db";

// TODO: replace with real domain queries.
export async function list${pascal}() {
  void db;
  return [] as Array<{ id: string; name: string }>;
}
`;

const actions = `"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actorFromSession, getRequestIpAddress, writeAuditLog } from "@/lib/audit/log";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";

// Register these keys in 菜单与权限 first:
//   ${resource}:read  (page node)
//   ${resource}:write (action node under the page)

export async function create${pascal}Action(formData: FormData) {
  const session = await requirePermission("${resource}:write");
  void formData;

  // Keep the protected mutation and its audit row in one transaction.
  await db.transaction(async (tx) => {
    // TODO: validate input and write the domain record with tx.
    await writeAuditLog({
      actor: actorFromSession(session),
      action: "${resource}.create",
      resourceType: "${resource}",
      summary: "创建 ${title}",
      ipAddress: await getRequestIpAddress(),
    }, tx);
  });

  revalidatePath("/app/${feature}");
  redirect("/app/${feature}?notice=created");
}
`;

const page = `import { StatusNotice } from "@/components/ui/status-notice";
import { ${resource}NoticeMessages } from "@/features/${feature}/messages";
import { list${pascal} } from "@/features/${feature}/queries";
import { requirePermission } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/rbac/permissions";

export default async function ${pascal}Page({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const session = await requirePermission("${resource}:read");
  const { notice } = await searchParams;
  const items = await list${pascal}();
  const canWrite = await roleHasPermission(session.user.role ?? "", "${resource}:write");

  return (
    <div className="space-y-7">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">${title}</p>
        <h1 className="text-3xl font-semibold tracking-[-0.022em]">${pascal}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          由 scaffold 生成的业务骨架。请补齐 schema、queries、actions，并在「菜单与权限」中注册入口。
        </p>
      </div>

      <StatusNotice notice={notice} messages={${resource}NoticeMessages} />

      <section className="rounded-xl bg-card p-5 shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)]">
        <h2 className="font-semibold">列表</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          当前 {items.length} 条。写权限：{canWrite ? "可用" : "只读"}。
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>在「菜单与权限」新增页面：路径 <code>/app/${feature}</code>，权限 key <code>${resource}:read</code></li>
          <li>在该页面下新增操作：权限 key <code>${resource}:write</code></li>
          <li>在「角色」中勾选对应节点</li>
          <li>实现 <code>src/features/${feature}/</code> 与数据库表</li>
        </ol>
      </section>
    </div>
  );
}
`;

writeFileSync(join(featureDir, "messages.ts"), messages);
writeFileSync(join(featureDir, "queries.ts"), queries);
writeFileSync(join(featureDir, "actions.ts"), actions);
writeFileSync(join(pageDir, "page.tsx"), page);

console.log(`Scaffolded feature "${feature}":
  src/features/${feature}/messages.ts
  src/features/${feature}/queries.ts
  src/features/${feature}/actions.ts
  src/app/app/${feature}/page.tsx

Next:
  1. In 菜单与权限, add a page (/app/${feature}, key ${resource}:read) and an action under it (key ${resource}:write)
  2. Grant them to roles in 角色
  3. Implement real queries/actions and schema migrations
`);
