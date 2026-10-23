import { Download, FileClock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ListPagination } from "@/components/ui/list-pagination";
import { ListSearchForm } from "@/components/ui/list-search-form";
import {
  SortableTableHead,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AuditDetailSheet } from "@/features/audit/components/audit-detail-sheet";
import { AUDIT_SORT_COLUMNS, listAuditLogsPage } from "@/lib/audit/queries";
import { requirePermission } from "@/lib/auth/session";
import { parseListQuery } from "@/lib/list/pagination";
import { formatDateTime } from "@/lib/utils";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    pageSize?: string;
    sort?: string;
    order?: string;
  }>;
}) {
  await requirePermission("audit:read");
  const params = await searchParams;
  const listQuery = parseListQuery(params, {
    sort: "createdAt",
    order: "desc",
    allowedSorts: AUDIT_SORT_COLUMNS,
  });
  const result = await listAuditLogsPage(listQuery);
  const exportHref = listQuery.q
    ? `/app/audit/export?q=${encodeURIComponent(listQuery.q)}`
    : "/app/audit/export";

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="审计"
        title="操作审计"
        description="只读查看关键写操作记录。审计行由系统追加写入，普通用户不可修改或删除。"
        actions={
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <a href={exportHref} download>
              <Download aria-hidden="true" className="size-4" />
              导出 CSV
            </a>
          </Button>
        }
      />

      <Card className="p-5">
        <ListSearchForm
          action="/app/audit"
          defaultQuery={listQuery.q}
          placeholder="按操作、摘要、操作人或资源搜索"
          label="搜索审计"
          pageSize={result.pageSize}
          sort={result.sort}
          order={result.order}
        />
      </Card>

      <Card
        aria-labelledby="audit-list-title"
        className="overflow-hidden"
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
          <EmptyState
            icon={FileClock}
            title="暂无审计记录"
            description="执行用户、角色、权限或菜单变更后会出现在这里。"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead
                  column="createdAt"
                  currentSort={result.sort}
                  currentOrder={result.order}
                  pathname="/app/audit"
                  q={listQuery.q}
                  pageSize={result.pageSize}
                >
                  时间
                </SortableTableHead>
                <SortableTableHead
                  column="actorEmail"
                  currentSort={result.sort}
                  currentOrder={result.order}
                  pathname="/app/audit"
                  q={listQuery.q}
                  pageSize={result.pageSize}
                >
                  操作人
                </SortableTableHead>
                <SortableTableHead
                  column="action"
                  currentSort={result.sort}
                  currentOrder={result.order}
                  pathname="/app/audit"
                  q={listQuery.q}
                  pageSize={result.pageSize}
                >
                  动作
                </SortableTableHead>
                <TableHead>摘要</TableHead>
                <SortableTableHead
                  column="resourceType"
                  currentSort={result.sort}
                  currentOrder={result.order}
                  pathname="/app/audit"
                  q={listQuery.q}
                  pageSize={result.pageSize}
                >
                  资源
                </SortableTableHead>
                <TableHead>IP</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                    {formatDateTime(item.createdAt)}
                  </TableCell>
                  <TableCell className="max-w-40 truncate text-sm">
                    {item.actorEmail ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      {item.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-72 text-sm">{item.summary}</TableCell>
                  <TableCell className="max-w-40 truncate font-mono text-xs text-muted-foreground">
                    {item.resourceType}
                    {item.resourceId ? `:${item.resourceId.slice(0, 8)}` : ""}
                  </TableCell>
                  <TableCell className="tabular-nums text-xs text-muted-foreground">
                    {item.ipAddress ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <AuditDetailSheet item={item} />
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
          sort={result.sort}
          order={result.order}
        />
      </Card>
    </div>
  );
}
