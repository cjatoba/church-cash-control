import Link from "next/link";
import { ArrowLeftIcon } from "./icons";

export function BackLink({ href, label = "Voltar" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="flex w-fit flex-col items-center gap-0.5 self-start rounded px-2 py-1.5 text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
    >
      <ArrowLeftIcon className="h-5 w-5" />
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}
