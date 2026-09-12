import { Skeleton } from "@/app/_components/skeleton";

export default function UsersLoading() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 py-10 dark:bg-black">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-baseline justify-between gap-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
