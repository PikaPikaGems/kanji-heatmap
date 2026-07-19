import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Status = "idle" | "pending" | "success" | "error";

interface FetchAllState<Raw extends readonly unknown[]> {
  status: Status;
  data: Raw | null;
  error: Error | null;
}

const fetchJson = async <T,>(path: string): Promise<T> => {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }
  return res.json() as Promise<T>;
};

interface LookupContextValue<Result> {
  status: Status;
  error: Error | null;
  /** Kicks off the (idempotent) fetch; called by consumer hooks on mount. */
  ensureLoaded: () => void;
  lookup: (kanji: string) => Result | null;
}

/**
 * Builds a "fetch one or more JSON assets, then look kanji up in them" provider.
 *
 * Every kanji dataset provider is the same component: fetch asset(s), expose a
 * `getForKanji(kanji)` through a context, and throw when used outside the
 * provider. This factory owns that boilerplate so each dataset only has to
 * declare its asset paths and a `select` that turns the raw data into its
 * per-kanji result.
 *
 * Fetching is lazy: the provider mounts without loading anything, and the
 * datasets are fetched (once, in parallel) the first time a consumer hook
 * mounts. Datasets only read on the kanji detail page therefore cost nothing on
 * the list/home screens.
 */
export function createKanjiLookupProvider<
  Raw extends readonly unknown[],
  Result,
>(config: {
  /** Used in the "must be used within a …Provider" error message. */
  name: string;
  /** One entry per raw dataset; fetched in parallel. */
  assetPaths: { [K in keyof Raw]: string };
  /** Maps the fetched datasets to a single kanji's result (or null). */
  select: (data: Raw, kanji: string) => Result | null;
}) {
  const Context = createContext<LookupContextValue<Result> | undefined>(
    undefined
  );
  const paths = config.assetPaths as readonly string[];

  const Provider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<FetchAllState<Raw>>({
      status: "idle",
      data: null,
      error: null,
    });
    const startedRef = useRef(false);
    const mountedRef = useRef(true);

    useEffect(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
      };
    }, []);

    const ensureLoaded = useCallback(() => {
      if (startedRef.current) {
        return;
      }
      startedRef.current = true;
      setState({ status: "pending", data: null, error: null });

      Promise.all(paths.map((path) => fetchJson(path)))
        .then((data) => {
          if (mountedRef.current) {
            setState({
              status: "success",
              data: data as unknown as Raw,
              error: null,
            });
          }
        })
        .catch((err) => {
          if (mountedRef.current) {
            setState({
              status: "error",
              data: null,
              error: err instanceof Error ? err : new Error(String(err)),
            });
          }
        });
    }, []);

    const value = useMemo<LookupContextValue<Result>>(
      () => ({
        status: state.status,
        error: state.error,
        ensureLoaded,
        lookup: (kanji: string) =>
          state.data && kanji ? config.select(state.data, kanji) : null,
      }),
      [state, ensureLoaded]
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
  };

  const useLookupContext = () => {
    const ctx = useContext(Context);
    if (ctx == null) {
      throw new Error(
        `use${config.name} must be used within a ${config.name}Provider`
      );
    }
    return ctx;
  };

  // Trigger the lazy fetch as soon as any consumer hook mounts.
  const useEnsureLoaded = (ensureLoaded: () => void) => {
    useEffect(() => {
      ensureLoaded();
    }, [ensureLoaded]);
  };

  /** Reactive result for one kanji. */
  const useLookup = (kanji: string): Result | null => {
    const { lookup, ensureLoaded } = useLookupContext();
    useEnsureLoaded(ensureLoaded);
    return useMemo(() => lookup(kanji), [lookup, kanji]);
  };

  /** The raw lookup function, for callers that resolve kanji lazily. */
  const useLookupFn = () => {
    const { lookup, ensureLoaded } = useLookupContext();
    useEnsureLoaded(ensureLoaded);
    return lookup;
  };

  /** Result plus load status/error, for callers that render loading states. */
  const useLookupState = (kanji: string) => {
    const { status, error, lookup, ensureLoaded } = useLookupContext();
    useEnsureLoaded(ensureLoaded);
    const data = useMemo(() => lookup(kanji), [lookup, kanji]);
    return { status, error, data };
  };

  return { Provider, useLookup, useLookupFn, useLookupState };
}
