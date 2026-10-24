"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { Skeleton } from "@/app/_components/skeleton";
import { SkeletonCard } from "@/app/_components/page-skeleton";

interface MonthOption {
  value: string;
  label: string;
}

export function MonthSelector({
  options,
  selectedValue,
  children,
}: {
  options: MonthOption[];
  selectedValue: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
        Mês
        <select
          defaultValue={selectedValue}
          disabled={isPending}
          onChange={(event) => {
            const value = event.target.value;
            startTransition(() => {
              router.push(`?month=${value}`);
            });
          }}
          className="min-h-14 rounded-2xl border border-zinc-300 bg-white px-4 text-lg font-semibold text-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="relative">
        <div className={isPending ? "flex flex-col gap-5 opacity-30" : "flex flex-col gap-5"}>
          {children}
        </div>
        {isPending ? (
          <div className="absolute inset-0 flex flex-col gap-5 bg-zinc-100 dark:bg-black">
            <SkeletonCard lines={4} />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
