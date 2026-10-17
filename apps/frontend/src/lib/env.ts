function readApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  const value = typeof raw === "string" ? raw.trim() : "";

  if (value.length === 0) {
    return "/api/v1";
  }

  return value.replace(/\/+$/, "");
}

/**
 * Typed, validated access to the frontend runtime configuration.
 * Only `VITE_`-prefixed variables are exposed to the browser by Vite.
 */
export const env = {
  apiBaseUrl: readApiBaseUrl(),
} as const;
