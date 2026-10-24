import { PageShell } from "@/app/_components/page-shell";
import { Skeleton } from "@/app/_components/skeleton";
import { SkeletonCard, SkeletonPageHeader } from "@/app/_components/page-skeleton";

export default function PledgeDetailLoading() {
  return (
    <PageShell>
      <SkeletonPageHeader />
      <SkeletonCard lines={3} />
      <Skeleton className="h-14 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
    </PageShell>
  );
}
