import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-zinc-100 text-zinc-900 dark:bg-black dark:text-zinc-50 print:bg-white">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 pt-4 pb-10 print:max-w-none print:p-0">
        {children}
      </div>
    </div>
  );
}
