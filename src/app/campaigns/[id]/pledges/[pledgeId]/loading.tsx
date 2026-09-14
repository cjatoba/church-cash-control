import { Skeleton } from "@/app/_components/skeleton";

export default function PledgeDetailLoading() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-10">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.16] dark:bg-zinc-950">
        <Skeleton className="h-4 w-32" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
