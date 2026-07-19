import { afterEach, describe, expect, it, vi } from "vitest";
import { render, renderHook, waitFor } from "@testing-library/react";
import { createKanjiLookupProvider } from "./create-kanji-lookup-provider";

type Raw = [Record<string, string>];

const makeProvider = () =>
  createKanjiLookupProvider<Raw, string>({
    name: "TestLookup",
    assetPaths: ["/json/test.json"],
    select: ([data], kanji) => data[kanji] ?? null,
  });

describe("createKanjiLookupProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches the asset and resolves a kanji through useLookupState", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ 火: "fire" }),
      })
    );

    const provider = makeProvider();
    const { result } = renderHook(() => provider.useLookupState("火"), {
      wrapper: provider.Provider,
    });

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data).toBe("fire");
    expect(result.current.error).toBeNull();
  });

  it("returns null for a kanji that is absent from the data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ 火: "fire" }),
      })
    );

    const provider = makeProvider();
    const { result } = renderHook(() => provider.useLookup("水"), {
      wrapper: provider.Provider,
    });

    await waitFor(() =>
      expect((globalThis.fetch as ReturnType<typeof vi.fn>)).toHaveBeenCalled()
    );
    expect(result.current).toBeNull();
  });

  it("surfaces an error status when the fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 })
    );

    const provider = makeProvider();
    const { result } = renderHook(() => provider.useLookupState("火"), {
      wrapper: provider.Provider,
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("throws when a hook is used outside its provider", () => {
    const provider = makeProvider();
    // Silence the expected React error-boundary console noise.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(<UsesLookup useLookup={() => provider.useLookup("火")} />)
    ).toThrow(/must be used within a TestLookupProvider/);
    spy.mockRestore();
  });
});

const UsesLookup = ({ useLookup }: { useLookup: () => string | null }) => {
  const value = useLookup();
  return <span>{value}</span>;
};
