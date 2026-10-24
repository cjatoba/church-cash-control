import Link from "next/link";
import { ChevronLeftIcon } from "./icons";

export function BackLink({ href, label = "Voltar" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 w-fit items-center gap-1.5 self-start rounded-full border border-zinc-200 bg-white py-2 pr-5 pl-3 text-base font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      <ChevronLeftIcon className="h-5 w-5" />
      {label}
    </Link>
  );
}
