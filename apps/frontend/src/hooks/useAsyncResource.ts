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
let cacheGeneration = 0;
const pendingResources = new Map<string, { promise: Promise<unknown>; controller: AbortController }>();

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
  cacheGeneration += 1;
  for (const pending of pendingResources.values()) pending.controller.abort();
  pendingResources.clear();
  responseCache.clear();
}

/** Shared by mounted views and bounded background preloads. */
function loadResource<T>(key: string, loader: (signal: AbortSignal) => Promise<T>, force = false): Promise<T> {
  if (!force) {
    const cached = readCache<T>(key);
    if (cached !== null) return Promise.resolve(cached);
    const pending = pendingResources.get(key);
    if (pending) return pending.promise as Promise<T>;
  }
  const previous = pendingResources.get(key);
  previous?.controller.abort();
  const controller = new AbortController();
  const generation = cacheGeneration;
  const entry = { controller, promise: Promise.resolve() as Promise<unknown> };
  entry.promise = Promise.resolve()
    .then(() => loader(controller.signal))
    .then((data) => {
      if (controller.signal.aborted || generation !== cacheGeneration)
        throw new DOMException("Resource invalidated", "AbortError");
      writeCache(key, data);
      return data;
    })
    .finally(() => {
      if (pendingResources.get(key) === entry) pendingResources.delete(key);
    });
  pendingResources.set(key, entry);
  return entry.promise as Promise<T>;
}

export function prefetchAsyncResource<T>(key: string, loader: (signal: AbortSignal) => Promise<T>): Promise<void> {
  return loadResource(key, loader).then(() => undefined);
}

/**
 * Generic data-loading hook: runs `loader` whenever `key` changes, exposes a
 * normalized status, and ignores results after unmount or key change. In-flight
 * work is shared with preloads so navigation never starts the same request twice.
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

    let cancelled = false;

    setStatus("loading");
    setError(null);

    loadResource(key, loaderRef.current, force)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setData(result);
        setStatus("success");
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return;
        }
        setData(null);
        setError(cause instanceof Error ? cause.message : "Something went wrong");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [key, enabled, reloadToken]);

  const reload = useCallback(() => {
    forceRef.current = true;
    setReloadToken((token) => token + 1);
  }, []);

  const matchesKey = keyRef.current === key;
  return {
    status: matchesKey ? status : "loading",
    data: matchesKey ? data : null,
    error: matchesKey ? error : null,
    reload,
  };
}

/** Helper for hooks that need to compare their dependency inputs by value. */
export function resourceKey(...parts: DependencyList): string {
  return parts.map((part) => String(part)).join("\u0000");
}
