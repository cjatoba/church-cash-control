import { Card } from "@/app/_components/card";

export function CurrentPledgeType({ label, summary }: { label: string; summary: string }) {
  return (
    <Card>
      <span className="text-sm font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400">
        Tipo atual
      </span>
      <span className="text-lg font-bold">{label}</span>
      <span className="text-[15px] text-zinc-600 dark:text-zinc-400">{summary}</span>
    </Card>
  );
}
