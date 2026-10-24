import { PageShell } from "@/app/_components/page-shell";
import { Skeleton } from "@/app/_components/skeleton";
import { SkeletonList, SkeletonPageHeader } from "@/app/_components/page-skeleton";

export default function DonorsLoading() {
  return (
    <PageShell>
      <SkeletonPageHeader />
      <Skeleton className="h-12 w-full rounded-full" />
      <SkeletonList rows={5} />
    </PageShell>
  );
}
