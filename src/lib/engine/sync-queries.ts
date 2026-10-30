import {
  createSyncStatusStore,
  FAILED_OPS_COUNT_KEY,
  keepLastReady,
  snapshotValue,
  SYNC_STATUS_KEY,
} from "./store-cache";
import { useEngineQuery } from "./use-engine-query";

/** `sync.watchStatus()`; undefined until it loads. */
export const useSyncStatus = () =>
  snapshotValue(useEngineQuery(SYNC_STATUS_KEY, createSyncStatusStore));

/** `sync.watchFailedOpsCount()`; undefined until it loads. */
export const useFailedOpsCount = () =>
  snapshotValue(
    useEngineQuery(FAILED_OPS_COUNT_KEY, (api) =>
      keepLastReady(api.sync.watchFailedOpsCount())
    )
  );
