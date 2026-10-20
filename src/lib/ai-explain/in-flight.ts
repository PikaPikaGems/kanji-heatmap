/**
 * AI requests keep running after the section that started them closes (the
 * kanji drawer closed, another kanji opened, a dialog closed): the reply is
 * saved as usual when it arrives. A section opened again mid-request finds
 * it here, shows it as generating, and reloads when it settles. Only Cancel,
 * or deleting all generated content, aborts one.
 */
type InFlight = { controller: AbortController; settled: Promise<void> };

const requests = new Map<string, InFlight>();

/** Tracks `task` under `key` until it settles. */
export const trackInFlight = (
  key: string,
  controller: AbortController,
  task: Promise<unknown>
) => {
  const settled = task.then(
    () => undefined,
    () => undefined
  );
  requests.set(key, { controller, settled });
  void settled.then(() => {
    if (requests.get(key)?.controller === controller) requests.delete(key);
  });
};

/** The request running for `key`, if any. */
export const getInFlight = (key: string): InFlight | undefined =>
  requests.get(key);

/** Cancel: aborts the request running for `key`. */
export const abortInFlight = (key: string) => {
  requests.get(key)?.controller.abort();
  requests.delete(key);
};
