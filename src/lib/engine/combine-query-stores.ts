import type { QuerySnapshot, QueryStore } from "engine-contract";

const LOADING: QuerySnapshot<never> = { status: "loading" };

const combineSnapshots = <T>(
  snapshots: QuerySnapshot<T>[]
): QuerySnapshot<T[]> => {
  const values: T[] = [];
  let loading = false;
  for (const snapshot of snapshots) {
    if (snapshot.status === "failed") return snapshot;
    if (snapshot.status === "loading") {
      loading = true;
      continue;
    }
    if (!snapshot.result.ok) {
      return {
        status: "ready",
        result: { ok: false, error: snapshot.result.error },
      };
    }
    values.push(snapshot.result.value);
  }
  if (loading) return LOADING;
  return { status: "ready", result: { ok: true, value: values } };
};

/**
 * One store over a fixed list of stores, so a view that needs many watches
 * (e.g. one per Fill in the Kanji set) takes a single useEngineQuery instead of
 * a hook per part. Ready only once every part is ready; the first failure wins.
 * Values come back in the order of `parts`.
 */
export const combineQueryStores = <T>(
  parts: readonly QueryStore<T>[]
): QueryStore<T[]> => {
  let last: { inputs: QuerySnapshot<T>[]; output: QuerySnapshot<T[]> } | null =
    null;

  return {
    getSnapshot: () => {
      const inputs = parts.map((part) => part.getSnapshot());
      // Same snapshot object until a part changes, as useSyncExternalStore needs.
      if (last && inputs.every((snapshot, i) => snapshot === last?.inputs[i])) {
        return last.output;
      }
      last = { inputs, output: combineSnapshots(inputs) };
      return last.output;
    },
    subscribe: (listener) => {
      const unsubscribes = parts.map((part) => part.subscribe(listener));
      return () => {
        for (const unsubscribe of unsubscribes) unsubscribe();
      };
    },
    refresh: async () => {
      await Promise.all(parts.map((part) => part.refresh()));
    },
  };
};
