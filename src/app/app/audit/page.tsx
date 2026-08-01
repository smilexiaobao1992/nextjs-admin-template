import { ListPagination } from "@/components/ui/list-pagination";
import { ListSearchForm } from "@/components/ui/list-search-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAuditLogsPage } from "@/lib/audit/queries";
import { requirePermission } from "@/lib/auth/session";
import { parseListQuery } from "@/lib/list/pagination";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; pageSize?: string }>;
}) {
  await requirePermission("audit:read");
  const params = await searchParams;
  const listQuery = parseListQuery(params);
  const result = await listAuditLogsPage(listQuery);

  return (
    <div className="space-y-7">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">审计</p>
        <h1 className="text-3xl font-semibold tracking-[-0.022em]">操作审计</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          只读查看关键写操作记录。审计行由系统追加写入，普通用户不可修改或删除。
        </p>
      </div>

      <div className="rounded-xl bg-card p-5 shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)]">
        <ListSearchForm
          action="/app/audit"
          defaultQuery={listQuery.q}
          placeholder="按操作、摘要、操作人或资源搜索"
          label="搜索审计"
        />
      </div>

      <section
        aria-labelledby="audit-list-title"
        className="overflow-hidden rounded-xl bg-card shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)]"
      >
        <div className="border-b border-border/70 px-5 py-4">
          <h2 id="audit-list-title" className="font-semibold">
            审计记录
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            共 <span className="tabular-nums">{result.total}</span> 条
          </p>
        </div>

        {result.items.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-medium">暂无审计记录</p>
            <p className="mt-2 text-sm text-muted-foreground">执行用户、角色、权限或菜单变更后会出现在这里。</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>操作人</TableHead>
                <TableHead>动作</TableHead>
                <TableHead>摘要</TableHead>
                <TableHead>资源</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                    {item.createdAt.toLocaleString("zh-CN")}
                  </TableCell>
                  <TableCell className="max-w-40 truncate text-sm">
                    {item.actorEmail ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.action}</TableCell>
                  <TableCell className="max-w-72 text-sm">{item.summary}</TableCell>
                  <TableCell className="max-w-40 truncate font-mono text-xs text-muted-foreground">
                    {item.resourceType}
                    {item.resourceId ? `:${item.resourceId.slice(0, 8)}` : ""}
                  </TableCell>
                  <TableCell className="tabular-nums text-xs text-muted-foreground">
                    {item.ipAddress ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <ListPagination
          pathname="/app/audit"
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
          q={listQuery.q}
        />
      </section>
    </div>
  );
}
