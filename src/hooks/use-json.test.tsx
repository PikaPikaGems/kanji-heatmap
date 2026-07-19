import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useJsonFetch, useTextFetch } from "./use-json";

describe("useJsonFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves to success with the parsed JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ hello: "world" }),
      })
    );

    const { result } = renderHook(() => useJsonFetch<{ hello: string }>("/x"));

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data).toEqual({ hello: "world" });
    expect(result.current.error).toBeNull();
  });

  // The error tests call execute() manually (immediate=false) because the
  // mount effect fires execute() un-awaited, and its rethrow would surface as
  // an unhandled rejection in the test runner.
  it("sets error status for a non-ok HTTP response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      })
    );

    const { result } = renderHook(() => useJsonFetch("/missing", false));
    await expect(result.current.execute()).rejects.toThrow("404");

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.data).toBeNull();
    expect(result.current.error?.message).toContain("404");
  });

  it("sets error status when fetch rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down"))
    );

    const { result } = renderHook(() => useJsonFetch("/x", false));
    await expect(result.current.execute()).rejects.toThrow("network down");

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.message).toBe("network down");
  });

  it("does not fetch when immediate is false", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useJsonFetch("/x", false));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
  });
});

describe("useTextFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves to success with response text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("# About"),
      })
    );

    const { result } = renderHook(() => useTextFetch("/md/about.md"));

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data).toBe("# About");
    expect(result.current.error).toBeNull();
  });

  it("sets error status for a non-ok HTTP response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      })
    );

    const { result } = renderHook(() => useTextFetch("/md/missing.md", false));
    await expect(result.current.execute()).rejects.toThrow("404");

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.message).toContain("404");
  });
});
