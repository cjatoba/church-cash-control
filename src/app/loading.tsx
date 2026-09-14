import { Skeleton } from "@/app/_components/skeleton";

export default function HomeLoading() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between gap-4 border-b border-black/[.08] px-6 py-4 dark:border-white/[.145]">
        <span className="font-semibold text-black dark:text-zinc-50">Controle de Caixa</span>
        <Skeleton className="h-4 w-24" />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-36 rounded-full" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-lg border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-950"
            >
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-2 w-full" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
