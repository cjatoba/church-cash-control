import { PageShell } from "@/app/_components/page-shell";
import { Skeleton } from "@/app/_components/skeleton";
import { SkeletonCard, SkeletonPageHeader } from "@/app/_components/page-skeleton";

export default function ChangePledgeTypeLoading() {
  return (
    <PageShell>
      <SkeletonPageHeader />
      <SkeletonCard lines={3} />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-14 w-full rounded-full" />
    </PageShell>
  );
}
