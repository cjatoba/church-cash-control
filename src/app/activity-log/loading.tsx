import { PageShell } from "@/app/_components/page-shell";
import { Skeleton } from "@/app/_components/skeleton";
import { SkeletonPageHeader } from "@/app/_components/page-skeleton";

export default function ActivityLogLoading() {
  return (
    <PageShell>
      <SkeletonPageHeader />
      <Skeleton className="h-96 w-full rounded-2xl" />
    </PageShell>
  );
}
