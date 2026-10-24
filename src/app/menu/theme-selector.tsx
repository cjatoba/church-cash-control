"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ThemePreference } from "@/app/_lib/theme";
import { DevicePhoneIcon, MoonIcon, SunIcon } from "@/app/_components/icons";

const options: { value: ThemePreference; label: string; icon: ReactNode }[] = [
  { value: "system", label: "Automático", icon: <DevicePhoneIcon /> },
  { value: "light", label: "Claro", icon: <SunIcon /> },
  { value: "dark", label: "Escuro", icon: <MoonIcon /> },
];

function ThemeOptions({ current }: { current: ThemePreference }) {
  const { pending, data } = useFormStatus();
  const selected = pending ? data.get("theme") : current;

  return (
    <div className="grid grid-cols-3 gap-1 rounded-2xl bg-zinc-200 p-1 dark:bg-zinc-800">
      {options.map((option) => (
        <button
          key={option.value}
          type="submit"
          name="theme"
          value={option.value}
          aria-pressed={selected === option.value}
          disabled={pending}
          className={
            selected === option.value
              ? "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-white text-[15px] font-semibold text-zinc-900 shadow-sm disabled:opacity-80 dark:bg-zinc-950 dark:text-zinc-50"
              : "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[15px] font-medium text-zinc-700 disabled:opacity-60 dark:text-zinc-300"
          }
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ThemeSelector({
  current,
  action,
}: {
  current: ThemePreference;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action}>
      <ThemeOptions current={current} />
    </form>
  );
}
