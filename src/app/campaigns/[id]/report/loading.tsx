import { PageShell } from "@/app/_components/page-shell";
import { Skeleton } from "@/app/_components/skeleton";
import { SkeletonPageHeader } from "@/app/_components/page-skeleton";

export default function FundraisingReportLoading() {
  return (
    <PageShell>
      <SkeletonPageHeader />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </PageShell>
  );
}
