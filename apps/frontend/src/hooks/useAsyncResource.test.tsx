import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearAsyncResourceCache,
  prefetchAsyncResource,
  resourceKey,
  useAsyncResource,
} from "@/hooks/useAsyncResource";

describe("useAsyncResource", () => {
  beforeEach(() => {
    clearAsyncResourceCache();
  });

  it("shares an in-flight preload with a visible slide", async () => {
    let finish!: (value: { value: number }) => void;
    const loader = vi.fn(
      () =>
        new Promise<{ value: number }>((resolve) => {
          finish = resolve;
        }),
    );
    const preload = prefetchAsyncResource("next-slide", loader);
    const { result } = renderHook(() => useAsyncResource(loader, "next-slide"));
    await waitFor(() => expect(loader).toHaveBeenCalledOnce());
    await act(async () => {
      finish({ value: 2 });
      await preload;
    });
    expect(result.current.data).toEqual({ value: 2 });
    expect(loader).toHaveBeenCalledOnce();
  });

  it("does not resurrect a preload after sync clears the cache", async () => {
    let finish!: (value: { value: number }) => void;
    const preload = prefetchAsyncResource(
      "old-slide",
      () =>
        new Promise<{ value: number }>((resolve) => {
          finish = resolve;
        }),
    );
    const rejected = expect(preload).rejects.toMatchObject({ name: "AbortError" });
    await waitFor(() => expect(finish).toBeDefined());
    clearAsyncResourceCache();
    finish({ value: 1 });
    await rejected;
    const loader = vi.fn().mockResolvedValue({ value: 3 });
    const { result } = renderHook(() => useAsyncResource(loader, "old-slide"));
    await waitFor(() => expect(result.current.data).toEqual({ value: 3 }));
    expect(loader).toHaveBeenCalledOnce();
  });

  it("memoizes a response so remounting does not refetch", async () => {
    const loader = vi.fn().mockResolvedValue({ value: 1 });

    const first = renderHook(() => useAsyncResource(loader, resourceKey("k")));
    await waitFor(() => expect(first.result.current.status).toBe("success"));
    first.unmount();

    const second = renderHook(() => useAsyncResource(loader, resourceKey("k")));

    expect(second.result.current.status).toBe("success");
    expect(second.result.current.data).toEqual({ value: 1 });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("uses a separate cache slot per key", async () => {
    const loader = vi.fn().mockResolvedValue({ value: 1 });

    const { result, rerender } = renderHook(({ key }: { key: string }) => useAsyncResource(loader, key), {
      initialProps: { key: "a" },
    });
    await waitFor(() => expect(result.current.status).toBe("success"));

    rerender({ key: "b" });

    await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  });

  it("reload() bypasses the cache", async () => {
    const loader = vi.fn().mockResolvedValue({ value: 1 });

    const { result } = renderHook(() => useAsyncResource(loader, resourceKey("k")));
    await waitFor(() => expect(result.current.status).toBe("success"));

    act(() => {
      result.current.reload();
    });

    await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  });

  it("reload() overwrites the memoized value", async () => {
    const loader = vi.fn().mockResolvedValueOnce({ value: 1 }).mockResolvedValueOnce({ value: 2 });

    const { result } = renderHook(() => useAsyncResource(loader, resourceKey("k")));
    await waitFor(() => expect(result.current.data).toEqual({ value: 1 }));

    act(() => {
      result.current.reload();
    });
    await waitFor(() => expect(result.current.data).toEqual({ value: 2 }));

    // A remount must see the refreshed value, not the original one.
    const { result: remounted } = renderHook(() => useAsyncResource(loader, resourceKey("k")));
    expect(remounted.current.data).toEqual({ value: 2 });
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("clears the previous value when the key changes", async () => {
    const loader = vi.fn().mockResolvedValue({ value: 1 });

    const { result, rerender } = renderHook(({ key }: { key: string }) => useAsyncResource(loader, key), {
      initialProps: { key: "a" },
    });
    await waitFor(() => expect(result.current.data).toEqual({ value: 1 }));

    rerender({ key: "b" });

    expect(result.current.status).toBe("loading");
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.data).toEqual({ value: 1 }));
  });

  it("does not cache failures", async () => {
    const loader = vi.fn().mockRejectedValue(new Error("boom"));

    const first = renderHook(() => useAsyncResource(loader, resourceKey("k")));
    await waitFor(() => expect(first.result.current.status).toBe("error"));
    first.unmount();

    const second = renderHook(() => useAsyncResource(loader, resourceKey("k")));
    await waitFor(() => expect(second.result.current.status).toBe("error"));

    expect(loader).toHaveBeenCalledTimes(2);
  });
});
