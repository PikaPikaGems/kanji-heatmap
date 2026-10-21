import { useAccountStatus } from "@/lib/engine/use-account-status";

/**
 * A dashboard panel's data. Logged in, it is the engine's value (undefined
 * until that read is ready, or if it failed). With no account to read from
 * (logged out, old browser, recovery, or the account still loading) it is
 * `empty`, so the panel draws its initial state instead of a log in prompt.
 */
export const useLiveOrEmpty = <T>(
  live: T | null | undefined,
  empty: T
): T | undefined => {
  const account = useAccountStatus();
  if (account.kind !== "active") return empty;
  return live ?? undefined;
};
