import Link from "next/link";
import type { ReactNode } from "react";
import { SectionTitle } from "./card";
import { ChevronRightIcon } from "./icons";

const iconToneClassNames = {
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  green: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
  neutral: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
} as const;

export type IconTone = keyof typeof iconToneClassNames;

export function NavSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      {title ? <SectionTitle>{title}</SectionTitle> : null}
      <ul className="flex flex-col divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {children}
      </ul>
    </section>
  );
}

export function NavListItem({
  href,
  title,
  description,
  icon,
  iconTone = "neutral",
}: {
  href: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  iconTone?: IconTone;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex min-h-16 items-center gap-4 px-4 py-3.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
      >
        {icon ? (
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconToneClassNames[iconTone]}`}
          >
            {icon}
          </span>
        ) : null}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[17px] font-semibold">{title}</span>
          {description ? (
            <span className="text-[15px] text-zinc-600 dark:text-zinc-400">{description}</span>
          ) : null}
        </span>
        <ChevronRightIcon className="h-5 w-5 shrink-0 text-zinc-500" />
      </Link>
    </li>
  );
}

export function NavListAction({ children }: { children: ReactNode }) {
  return <li>{children}</li>;
}
