"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { Skeleton } from "@/app/_components/skeleton";

interface MonthOption {
  value: string;
  label: string;
}

export function MonthSelector({
  options,
  selectedValue,
  monthLabel,
  children,
}: {
  options: MonthOption[];
  selectedValue: string;
  monthLabel: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">{monthLabel}</h1>
        <select
          aria-label="Selecionar mês"
          defaultValue={selectedValue}
          disabled={isPending}
          onChange={(event) => {
            const value = event.target.value;
            startTransition(() => {
              router.push(`?month=${value}`);
            });
          }}
          className="rounded border border-black/[.08] px-3 py-2 text-sm disabled:opacity-60 dark:border-white/[.16] dark:bg-black"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="relative">
        <div className={isPending ? "flex flex-col gap-4 opacity-30" : "flex flex-col gap-4"}>
          {children}
        </div>
        {isPending ? (
          <div className="absolute inset-0 flex flex-col gap-4 bg-white pt-1 dark:bg-zinc-950">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2.5 w-full" />
            </div>
            <div className="flex flex-col gap-2 border-t border-black/[.08] pt-4 dark:border-white/[.16]">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="flex flex-col gap-2 border-t border-black/[.08] pt-4 dark:border-white/[.16]">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
