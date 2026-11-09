import { URL_PARAMS } from "@/lib/settings/url-params";

/**
 * `/` and `/mastery` share one search, sort and filter (their URL params);
 * every other param (`bg-src`, `open`, …) stays with the page that set it.
 */
export const SEARCH_SHARING_PAGES = ["/", "/mastery"];

const collectParamNames = (value: string | object): string[] =>
  typeof value === "string"
    ? [value]
    : Object.values(value).flatMap(collectParamNames);

const sharedParamNames = new Set(
  collectParamNames([
    URL_PARAMS.textSearch,
    URL_PARAMS.filterSettings,
    URL_PARAMS.sortSettings,
  ])
);

const rememberedSearches = new Map<string, string>();
const listeners = new Set<() => void>();

const withSharedParams = (search: string, source: URLSearchParams) => {
  const next = new URLSearchParams(search);
  sharedParamNames.forEach((name) => next.delete(name));
  source.forEach((value, name) => {
    if (sharedParamNames.has(name)) {
      next.append(name, value);
    }
  });
  return next.toString();
};

export const getRememberedHref = (page: string) => {
  const search = rememberedSearches.get(page) ?? "";
  return search === "" ? page : `${page}?${search}`;
};

export const rememberSearch = (page: string, search: string) => {
  if (search === (rememberedSearches.get(page) ?? "")) {
    return;
  }

  const source = new URLSearchParams(search);
  rememberedSearches.set(page, search);
  SEARCH_SHARING_PAGES.forEach((otherPage) => {
    if (otherPage === page) {
      return;
    }
    const otherSearch = rememberedSearches.get(otherPage) ?? "";
    rememberedSearches.set(otherPage, withSharedParams(otherSearch, source));
  });
  listeners.forEach((listener) => listener());
};

export const subscribeToRememberedSearches = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
