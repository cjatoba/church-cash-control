export function VolunteerTransferBadge({ label }: { label: string }) {
  return (
    <span className="w-fit rounded-full bg-violet-100 px-2.5 py-0.5 text-sm font-medium text-violet-800 dark:bg-violet-950 dark:text-violet-300">
      {label}
    </span>
  );
}
