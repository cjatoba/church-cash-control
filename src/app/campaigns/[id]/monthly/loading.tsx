import { Skeleton } from "@/app/_components/skeleton";

export default function MonthlyProgressLoading() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-10">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
        <Skeleton className="h-4 w-32" />

        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-40" />
        </div>

        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2 w-full" />
        </div>

        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>

        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  );
}
