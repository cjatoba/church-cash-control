import { PageShell } from "@/app/_components/page-shell";
import { Skeleton } from "@/app/_components/skeleton";
import { SkeletonCard, SkeletonList, SkeletonPageHeader } from "@/app/_components/page-skeleton";

export default function CampaignLoading() {
  return (
    <PageShell>
      <SkeletonPageHeader />
      <SkeletonCard lines={4} />
      <Skeleton className="h-16 w-full rounded-full" />
      <SkeletonList rows={2} />
      <SkeletonList rows={2} />
    </PageShell>
  );
}
