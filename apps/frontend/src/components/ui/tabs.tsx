import { cn } from "@/lib/utils";

interface TabsProps<T extends string> {
  items: readonly { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Minimal controlled segmented control. Kept dependency-free so it can back any
 * view switcher without pulling in a full tabs library.
 */
export function Tabs<T extends string>({ items, value, onChange, className }: TabsProps<T>) {
  return (
    <div role="tablist" className={cn("inline-flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1", className)}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            value === item.id
              ? "bg-background font-medium text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
