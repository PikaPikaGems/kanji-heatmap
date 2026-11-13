import { FillTheKanjiSetFile } from "./types";

/**
 * Set chunks already loaded this visit, by URL, so Retry Mistakes and the
 * next batch in the same chunk don't fetch and parse it again. A failed load
 * is forgotten, so "Try again" fetches it afresh.
 */
const loaded = new Map<string, FillTheKanjiSetFile>();
const pending = new Map<string, Promise<FillTheKanjiSetFile>>();

/** The chunk if it has already loaded, else null. */
export const peekChunk = (url: string): FillTheKanjiSetFile | null =>
  loaded.get(url) ?? null;

export const loadChunk = (url: string): Promise<FillTheKanjiSetFile> => {
  const done = loaded.get(url);
  if (done) return Promise.resolve(done);
  const inFlight = pending.get(url);
  if (inFlight) return inFlight;

  const request = fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
      }
      return response.json() as Promise<FillTheKanjiSetFile>;
    })
    .then((file) => {
      loaded.set(url, file);
      return file;
    })
    .finally(() => pending.delete(url));
  pending.set(url, request);
  return request;
};
