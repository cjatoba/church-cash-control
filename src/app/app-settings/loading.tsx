import { PageShell } from "@/app/_components/page-shell";
import { Skeleton } from "@/app/_components/skeleton";
import { SkeletonPageHeader } from "@/app/_components/page-skeleton";

export default function AppSettingsLoading() {
  return (
    <PageShell>
      <SkeletonPageHeader />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-72 w-full rounded-2xl" />
    </PageShell>
  );
}
