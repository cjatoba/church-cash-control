import { PageShell } from "@/app/_components/page-shell";
import { Skeleton } from "@/app/_components/skeleton";
import { SkeletonCard } from "@/app/_components/page-skeleton";

export default function HomeLoading() {
  return (
    <PageShell>
      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-7 w-32" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
      <Skeleton className="h-6 w-40" />
      <SkeletonCard lines={4} />
      <SkeletonCard lines={4} />
    </PageShell>
  );
}
