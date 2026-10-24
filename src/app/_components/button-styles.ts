export const buttonClassNames = {
  primary:
    "min-h-12 rounded-full bg-zinc-900 px-6 text-base font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300",
  primaryLarge:
    "min-h-16 w-full rounded-full bg-zinc-900 px-6 text-lg font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300",
  outline:
    "min-h-12 rounded-full border border-zinc-300 bg-white px-5 text-base font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
  danger:
    "min-h-14 w-full rounded-full border border-red-300 bg-white px-6 text-[17px] font-semibold text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/40",
  text: "min-h-11 rounded px-2 text-[15px] text-zinc-700 underline hover:text-black dark:text-zinc-300 dark:hover:text-zinc-50",
} as const;

export type ButtonVariant = keyof typeof buttonClassNames;

export const buttonBaseClassName =
  "inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60";
