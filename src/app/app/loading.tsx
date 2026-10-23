import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="space-y-7" aria-busy="true" aria-label="正在加载内容">
      <div className="space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <Card className="p-5">
        <Skeleton className="h-10 w-full" />
      </Card>

      <Card className="space-y-4 p-5">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-64 w-full" />
      </Card>
    </div>
  );
}
