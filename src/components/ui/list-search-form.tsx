import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export function ListSearchForm({
  action,
  defaultQuery = "",
  placeholder = "搜索…",
  label = "搜索",
}: {
  action: string;
  defaultQuery?: string;
  placeholder?: string;
  label?: string;
}) {
  return (
    <form action={action} method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
      <SubmitButton variant="outline" pendingLabel="搜索中…">
        搜索
      </SubmitButton>
    </form>
  );
}
