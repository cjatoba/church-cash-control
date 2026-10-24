import { PageShell } from "@/app/_components/page-shell";
import { Skeleton } from "@/app/_components/skeleton";
import { SkeletonPageHeader } from "@/app/_components/page-skeleton";

export default function InstallLoading() {
  return (
    <PageShell>
      <SkeletonPageHeader />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-14 w-full rounded-2xl" />
      <Skeleton className="h-56 w-full rounded-2xl" />
    </PageShell>
  );
}
