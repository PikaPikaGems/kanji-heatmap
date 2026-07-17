import { URL_PARAMS } from "@/lib/settings/url-params";
import { getLastHomeSearchParams } from "@/lib/settings/last-home-search-params";
import { useSearchParams, useUrlLocation } from "./routing-hooks";

const homeHrefFromSearch = (search: string) => {
  return search ? `/?${search}` : "/";
};

/**
 * Href for navigating to the kanji explore home route, preserving the last
 * session search/filter/sort/bg-src query string.
 *
 * On `/`, uses the live URL (minus `open`). Elsewhere, uses the in-memory
 * cache from the last time the user was on home.
 */
export const useHomeHref = () => {
  const location = useUrlLocation();
  const [searchParams] = useSearchParams();

  if (location === "/") {
    const current = new URLSearchParams(searchParams);
    current.delete(URL_PARAMS.openKanji);
    return homeHrefFromSearch(current.toString());
  }

  const cached = getLastHomeSearchParams();
  return homeHrefFromSearch(cached ?? "");
};
