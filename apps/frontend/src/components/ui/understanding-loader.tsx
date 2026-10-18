import { cn } from "@/lib/utils";

export function UnderstandingLoader({
  label = "Connecting the dots…",
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-4",
        !compact && "flex-col justify-center rounded-3xl bg-teal-50/60 px-6 py-8 dark:bg-teal-950/20",
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "understanding-wave relative isolate grid shrink-0 grid-cols-9 gap-1.5 overflow-hidden rounded-2xl p-3",
          compact ? "w-24 gap-1 p-1" : "w-48",
        )}
      >
        <span className="understanding-glow absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-teal-300 via-violet-300 to-pink-300 opacity-65 blur-xl" />
        {Array.from({ length: 45 }, (_, index) => (
          <span
            key={index}
            className="understanding-cell aspect-square rounded-[3px] bg-teal-500/70 dark:bg-teal-300/70"
            style={{ animationDelay: `${(index % 9) * 90 + Math.floor(index / 9) * 70}ms` }}
          />
        ))}
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
