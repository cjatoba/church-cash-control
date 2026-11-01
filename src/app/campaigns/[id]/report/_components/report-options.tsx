"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { buttonBaseClassName, buttonClassNames } from "@/app/_components/button-styles";
import { DocumentIcon } from "@/app/_components/icons";
import { Skeleton } from "@/app/_components/skeleton";
import { SkeletonCard } from "@/app/_components/page-skeleton";

export type ReportVersion = "summary" | "detailed";

interface MonthOption {
  value: string;
  label: string;
}

export interface ReportOptionsValue {
  wholeCampaign: boolean;
  from: string;
  to: string;
  version: ReportVersion;
}

const segmentClassName = "min-h-12 rounded-xl text-[15px] font-semibold transition-colors";
const selectedSegmentClassName =
  "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50";
const idleSegmentClassName = "text-zinc-600 dark:text-zinc-400";
const selectClassName =
  "min-h-12 rounded-xl border border-zinc-300 bg-white px-3 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const versionOptions: { value: ReportVersion; title: string; description: string }[] = [
  {
    value: "summary",
    title: "Resumido",
    description: "Só totais, sem nome de doador. Para prestar contas.",
  },
  {
    value: "detailed",
    title: "Detalhado",
    description: "Totais e cada entrada, com o nome de quem doou. Para controle interno.",
  },
];

export function ReportOptions({
  monthOptions,
  initialValue,
  canSeeDetailed,
  children,
}: {
  monthOptions: MonthOption[];
  initialValue: ReportOptionsValue;
  canSeeDetailed: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(initialValue);

  function showReport() {
    const query = new URLSearchParams({ show: "1", version: value.version });
    if (!value.wholeCampaign) {
      query.set("from", value.from);
      query.set("to", value.to);
    }
    startTransition(() => {
      router.push(`?${query.toString()}`);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-5 print:hidden dark:border-zinc-800 dark:bg-zinc-900">
        <fieldset className="flex flex-col gap-2" disabled={isPending}>
          <legend className="mb-2 text-[17px] font-semibold">Período</legend>
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-zinc-200 p-1 dark:bg-zinc-800">
            {[
              { label: "Campanha inteira", wholeCampaign: true },
              { label: "Escolher meses", wholeCampaign: false },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={value.wholeCampaign === option.wholeCampaign}
                onClick={() => {
                  setValue({ ...value, wholeCampaign: option.wholeCampaign });
                }}
                className={`${segmentClassName} ${
                  value.wholeCampaign === option.wholeCampaign
                    ? selectedSegmentClassName
                    : idleSegmentClassName
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {value.wholeCampaign ? null : (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
                De
                <select
                  value={value.from}
                  onChange={(event) => {
                    setValue({ ...value, from: event.target.value });
                  }}
                  className={selectClassName}
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
                Até
                <select
                  value={value.to}
                  onChange={(event) => {
                    setValue({ ...value, to: event.target.value });
                  }}
                  className={selectClassName}
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </fieldset>

        {canSeeDetailed ? (
          <fieldset className="flex flex-col gap-2" disabled={isPending}>
            <legend className="mb-2 text-[17px] font-semibold">O que mostrar</legend>
            {versionOptions.map((option) => {
              const selected = value.version === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setValue({ ...value, version: option.value });
                  }}
                  className={`flex flex-col gap-0.5 rounded-xl p-4 text-left ${
                    selected
                      ? "border-2 border-zinc-900 dark:border-zinc-50"
                      : "border border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <span className="text-[17px] font-semibold">{option.title}</span>
                  <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </fieldset>
        ) : null}

        <button
          type="button"
          onClick={showReport}
          disabled={isPending}
          className={`${buttonBaseClassName} ${buttonClassNames.primaryLarge}`}
        >
          <DocumentIcon />
          {isPending ? "Montando o relatório…" : "Ver relatório"}
        </button>
      </section>

      <div className="relative">
        <div className={isPending ? "opacity-30" : undefined}>{children}</div>
        {isPending ? (
          <div className="absolute inset-0 flex flex-col gap-5 bg-zinc-100 dark:bg-black">
            <SkeletonCard lines={4} />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
