let rememberedHomeSearch = "";
const listeners = new Set<() => void>();

export const getRememberedHomeHref = () => {
  return rememberedHomeSearch === "" ? "/" : `/?${rememberedHomeSearch}`;
};

export const rememberHomeSearch = (search: string) => {
  if (search === rememberedHomeSearch) {
    return;
  }

  rememberedHomeSearch = search;
  listeners.forEach((listener) => listener());
};

export const subscribeToRememberedHomeSearch = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
