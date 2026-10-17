/** Per-block accent colours, drawn from the theme's chart palette. */
const ACCENTS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"] as const;

export function accentFor(index: number): string {
  return ACCENTS[index % ACCENTS.length] ?? "var(--primary)";
}

/** A translucent tint of an accent, used to tint annotated code regions. */
export function accentTint(accent: string, strength: number): string {
  return `color-mix(in oklab, ${accent} ${strength}%, transparent)`;
}
