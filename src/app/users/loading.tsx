import { PageShell } from "@/app/_components/page-shell";
import { Skeleton } from "@/app/_components/skeleton";
import { SkeletonPageHeader } from "@/app/_components/page-skeleton";

export default function UsersLoading() {
  return (
    <PageShell>
      <SkeletonPageHeader />
      <Skeleton className="h-12 w-full rounded-full" />
      <Skeleton className="h-14 w-full rounded-2xl" />
      <Skeleton className="h-36 w-full rounded-2xl" />
      <Skeleton className="h-36 w-full rounded-2xl" />
    </PageShell>
  );
}
