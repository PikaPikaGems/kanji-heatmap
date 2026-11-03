import { useDataDownload } from "@/lib/engine/data-download";
import { useAccountStatus } from "@/lib/engine/use-account-status";

/**
 * Whether the dashboard has an account to read from: logged in, with its
 * data on this device. Otherwise the panels draw their empty state.
 */
export const useHasLiveAccount = () => {
  const account = useAccountStatus();
  const download = useDataDownload();
  return account.kind === "active" && download === "ready";
};

/**
 * A dashboard panel's data. Logged in, it is the engine's value (undefined
 * until that read is ready, or if it failed). With no account to read from
 * (logged out, old browser, recovery, the account still loading, or its data
 * not downloaded yet) it is `empty`, so the panel draws its initial state
 * instead of a log in prompt or an endless skeleton.
 */
export const useLiveOrEmpty = <T>(
  live: T | null | undefined,
  empty: T
): T | undefined => {
  if (!useHasLiveAccount()) return empty;
  return live ?? undefined;
};
