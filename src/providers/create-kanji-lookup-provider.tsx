import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
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

/**
 * Fetches every path in parallel and reports one combined status. `paths` is a
 * stable module-level array (built once when the factory is called), so the
 * fetch runs a single time on mount.
 */
const useJsonFetchAll = <Raw extends readonly unknown[]>(
  paths: readonly string[]
): FetchAllState<Raw> => {
  const [state, setState] = useState<FetchAllState<Raw>>({
    status: "idle",
    data: null,
    error: null,
  });

  // Effect needed: loads the JSON assets (external side effect); the cancelled
  // flag guards against a resolve after unmount.
  useEffect(() => {
    let cancelled = false;
    setState({ status: "pending", data: null, error: null });

    Promise.all(paths.map((path) => fetchJson(path)))
      .then((data) => {
        if (!cancelled) {
          setState({ status: "success", data: data as unknown as Raw, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            status: "error",
            data: null,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [paths]);

  return state;
};

interface LookupContextValue<Result> {
  status: Status;
  error: Error | null;
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
    const { status, data, error } = useJsonFetchAll<Raw>(paths);

    const value = useMemo<LookupContextValue<Result>>(
      () => ({
        status,
        error,
        lookup: (kanji: string) =>
          data && kanji ? config.select(data, kanji) : null,
      }),
      [status, data, error]
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

  /** Reactive result for one kanji. */
  const useLookup = (kanji: string): Result | null => {
    const { lookup } = useLookupContext();
    return useMemo(() => lookup(kanji), [lookup, kanji]);
  };

  /** The raw lookup function, for callers that resolve kanji lazily. */
  const useLookupFn = () => useLookupContext().lookup;

  /** Result plus load status/error, for callers that render loading states. */
  const useLookupState = (kanji: string) => {
    const { status, error, lookup } = useLookupContext();
    const data = useMemo(() => lookup(kanji), [lookup, kanji]);
    return { status, error, data };
  };

  return { Provider, useLookup, useLookupFn, useLookupState };
}
