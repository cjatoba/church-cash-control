import { Skeleton } from "./skeleton";

export function SkeletonPageHeader() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-40" />
      {Array.from({ length: Math.max(lines - 2, 0) }, (_, index) => (
        <Skeleton key={index} className="h-3 w-full" />
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="mx-1 h-4 w-28" />
      <div className="flex flex-col divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-4">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonFormPage({ fields = 3 }: { fields?: number }) {
  return (
    <div className="flex flex-1 justify-center bg-zinc-100 px-4 py-6 sm:items-center sm:py-10 dark:bg-black">
      <div className="flex w-full max-w-md flex-col gap-5 self-start rounded-2xl border border-zinc-200 bg-white p-6 sm:self-auto sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <Skeleton className="h-12 w-28 rounded-full" />
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: fields }, (_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}
