import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { DEFAULT_PAGE_SIZE, type SortOrder } from "@/lib/list/pagination";

export function ListSearchForm({
  action,
  defaultQuery = "",
  placeholder = "搜索…",
  label = "搜索",
  pageSize,
  sort,
  order,
}: {
  action: string;
  defaultQuery?: string;
  placeholder?: string;
  label?: string;
  pageSize?: number;
  sort?: string;
  order?: SortOrder;
}) {
  return (
    <form action={action} method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
      {pageSize && pageSize !== DEFAULT_PAGE_SIZE ? (
        <input type="hidden" name="pageSize" value={pageSize} />
      ) : null}
      {sort ? <input type="hidden" name="sort" value={sort} /> : null}
      {sort && order ? <input type="hidden" name="order" value={order} /> : null}
      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor="list-search-q">{label}</Label>
        <Input
          id="list-search-q"
          name="q"
          type="search"
          defaultValue={defaultQuery}
          placeholder={placeholder}
          autoComplete="off"
          maxLength={100}
        />
      </div>
      <div className="flex items-center gap-2">
        <SubmitButton variant="outline" pendingLabel="搜索中…">
          搜索
        </SubmitButton>
        {defaultQuery ? (
          <Button variant="ghost" asChild>
            <Link href={action}>重置</Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}
