import { snapshotValue, SYNC_STATUS_KEY } from "./store-cache";
import { useEngineQuery } from "./use-engine-query";

/** `sync.watchStatus()`; undefined until it loads. */
export const useSyncStatus = () =>
  snapshotValue(
    useEngineQuery(SYNC_STATUS_KEY, (api) => api.sync.watchStatus())
  );

/** `sync.watchFailedOpsCount()`; undefined until it loads. */
export const useFailedOpsCount = () =>
  snapshotValue(
    useEngineQuery("sync.watchFailedOpsCount", (api) =>
      api.sync.watchFailedOpsCount()
    )
  );
