import { Skeleton } from "@/app/_components/skeleton";

export default function DonorDetailLoading() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-10">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.16] dark:bg-zinc-950">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-5 w-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
