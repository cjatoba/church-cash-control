import { PageShell } from "@/app/_components/page-shell";
import { Skeleton } from "@/app/_components/skeleton";
import { SkeletonCard, SkeletonPageHeader } from "@/app/_components/page-skeleton";

export default function LoosePledgeDetailLoading() {
  return (
    <PageShell>
      <SkeletonPageHeader />
      <SkeletonCard lines={3} />
      <Skeleton className="h-16 w-full rounded-full" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </PageShell>
  );
}
