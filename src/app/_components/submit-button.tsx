"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

const variantClasses = {
  primary:
    "rounded-full bg-foreground px-5 py-2.5 font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]",
  outline:
    "rounded-full border border-black/[.08] px-3 py-2 text-sm text-zinc-700 hover:border-black/[.14] dark:border-white/[.16] dark:text-zinc-300 dark:hover:border-white/[.22]",
  text: "rounded px-2 py-1.5 text-xs text-zinc-600 underline hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50",
} as const;

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
}: {
  children: ReactNode;
  pendingLabel: string;
  variant?: keyof typeof variantClasses;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${variantClasses[variant]}`}
    >
      {pending ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
            />
          </svg>
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
