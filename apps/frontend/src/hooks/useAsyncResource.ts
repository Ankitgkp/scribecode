import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";

export interface AsyncResource<T> {
  status: "loading" | "success" | "error";
  data: T | null;
  error: string | null;
  reload: () => void;
}

interface UseAsyncResourceOptions {
  enabled?: boolean;
}

interface CacheEntry {
  data: unknown;
  storedAt: number;
}

/** How long a successful response stays usable without refetching. */
const CACHE_TTL_MS = 5 * 60_000;
/** Upper bound on memoized responses, so the cache cannot grow without limit. */
const CACHE_LIMIT = 60;

const responseCache = new Map<string, CacheEntry>();

function readCache<T>(key: string): T | null {
  const entry = responseCache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() - entry.storedAt > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }

  // Re-insert so the least-recently-used entry is evicted first.
  responseCache.delete(key);
  responseCache.set(key, entry);

  return entry.data as T;
}

function writeCache(key: string, data: unknown): void {
  responseCache.set(key, { data, storedAt: Date.now() });

  while (responseCache.size > CACHE_LIMIT) {
    const oldest = responseCache.keys().next().value;

    if (oldest === undefined) {
      break;
    }

    responseCache.delete(oldest);
  }
}

/** Clears every memoized response. Exposed for tests. */
export function clearAsyncResourceCache(): void {
  responseCache.clear();
}

/**
 * Generic data-loading hook: runs `loader` whenever `key` changes, exposes a
 * normalized status, and aborts in-flight work on unmount or key change.
 *
 * Successful responses are memoized by `key`, so remounting a component (for
 * example when switching tabs) or returning to a view resolves instantly from
 * memory instead of refetching — which also avoids re-running expensive server
 * work such as rebuilding a graph or calling a model.
 *
 * `key` (rather than a dependency array) keeps the effect dependency list
 * static, which avoids stale-closure and lint pitfalls. Callers that need a
 * guaranteed fresh response call `reload()`, which bypasses the cache while
 * keeping the same key so the refreshed value overwrites the memoized one.
 */
export function useAsyncResource<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  key: string,
  options: UseAsyncResourceOptions = {},
): AsyncResource<T> {
  const enabled = options.enabled ?? true;

  const [data, setData] = useState<T | null>(() => (enabled ? readCache<T>(key) : null));
  const [status, setStatus] = useState<AsyncResource<T>["status"]>(() => (data !== null ? "success" : "loading"));
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const forceRef = useRef(false);
  const keyRef = useRef(key);

  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    if (!enabled) {
      keyRef.current = key;
      setStatus("loading");
      setData(null);
      setError(null);
      return;
    }

    const force = forceRef.current;
    forceRef.current = false;

    // A new key is a different resource: drop the previous value so we never
    // render one item's data under another item's key.
    if (keyRef.current !== key) {
      keyRef.current = key;
      setData(null);
    }

    const memoized = force ? null : readCache<T>(key);

    if (memoized !== null) {
      setData(memoized);
      setStatus("success");
      setError(null);
      return;
    }

    const controller = new AbortController();

    setStatus("loading");
    setError(null);

    loaderRef
      .current(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) {
          return;
        }
        writeCache(key, result);
        setData(result);
        setStatus("success");
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setData(null);
        setError(cause instanceof Error ? cause.message : "Something went wrong");
        setStatus("error");
      });

    return () => {
      controller.abort();
    };
  }, [key, enabled, reloadToken]);

  const reload = useCallback(() => {
    forceRef.current = true;
    setReloadToken((token) => token + 1);
  }, []);

  return { status, data, error, reload };
}

/** Helper for hooks that need to compare their dependency inputs by value. */
export function resourceKey(...parts: DependencyList): string {
  return parts.map((part) => String(part)).join("\u0000");
}
