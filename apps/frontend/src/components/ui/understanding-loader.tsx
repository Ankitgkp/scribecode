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
        "understanding-wash relative isolate flex items-center justify-center overflow-hidden rounded-xl",
        compact ? "min-h-12 gap-3 px-4 py-3" : "min-h-36 px-6 py-8",
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <span className="understanding-cloud understanding-cloud-a" />
        <span className="understanding-cloud understanding-cloud-b" />
        <span className="understanding-cloud understanding-cloud-c" />
      </div>
      <p className="relative text-sm font-medium text-foreground/65">{label}</p>
    </div>
  );
}
