export function ProgressBar({ percentage }: { percentage: number }) {
  const reached = percentage >= 100;

  return (
    <div
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
    >
      <div
        className={
          reached ? "h-full rounded-full bg-green-600" : "h-full rounded-full bg-amber-500"
        }
        style={{ width: `${String(Math.min(percentage, 100))}%` }}
      />
    </div>
  );
}
