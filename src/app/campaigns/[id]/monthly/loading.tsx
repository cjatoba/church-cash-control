import { PageShell } from "@/app/_components/page-shell";
import { Skeleton } from "@/app/_components/skeleton";
import { SkeletonCard, SkeletonPageHeader } from "@/app/_components/page-skeleton";

export default function MonthlyProgressLoading() {
  return (
    <PageShell>
      <SkeletonPageHeader />
      <Skeleton className="h-14 w-full rounded-2xl" />
      <SkeletonCard lines={4} />
      <Skeleton className="h-14 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </PageShell>
  );
}
