import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "./icons";

export const roundIconButtonClassName =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800";

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Voltar",
  action,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-center gap-3">
      {backHref ? (
        <Link href={backHref} aria-label={backLabel} className={roundIconButtonClassName}>
          <ChevronLeftIcon />
        </Link>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="text-2xl font-bold break-words">{title}</h1>
        {subtitle ? (
          <p className="text-[15px] text-zinc-600 dark:text-zinc-400">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
