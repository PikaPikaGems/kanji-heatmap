import { URL_PARAMS } from "./url-params";

/**
 * In-memory cache of the last home (`/`) search string for the current
 * session. Survives client-side navigations away from `/` (and provider
 * remounts) so bare `/` links can restore filters, sort, bg-src, etc.
 *
 * `null` means home has not been visited yet this session.
 */
let lastHomeSearchParams: string | null = null;

const withoutOpenKanji = (params: URLSearchParams) => {
  const next = new URLSearchParams(params);
  next.delete(URL_PARAMS.openKanji);
  return next;
};

export const getLastHomeSearchParams = (): string | null => {
  return lastHomeSearchParams;
};

export const rememberHomeSearchParams = (params: URLSearchParams) => {
  lastHomeSearchParams = withoutOpenKanji(params).toString();
};
