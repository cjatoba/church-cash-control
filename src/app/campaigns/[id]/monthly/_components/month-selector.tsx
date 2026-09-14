"use client";

import { useRouter } from "next/navigation";

interface MonthOption {
  value: string;
  label: string;
}

export function MonthSelector({
  options,
  selectedValue,
}: {
  options: MonthOption[];
  selectedValue: string;
}) {
  const router = useRouter();

  return (
    <select
      aria-label="Selecionar mês"
      defaultValue={selectedValue}
      onChange={(event) => {
        router.push(`?month=${event.target.value}`);
      }}
      className="rounded border border-black/[.08] px-3 py-2 text-sm dark:border-white/[.145] dark:bg-black"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
