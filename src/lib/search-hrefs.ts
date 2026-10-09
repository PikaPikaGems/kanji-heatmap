export const radicalSearchHref = (searchText: string) =>
  `/?search-type=radicals&search-text=${encodeURIComponent(searchText)}`;

export const componentSearchHref = (component: string) =>
  `/?search-type=components&search-text=${encodeURIComponent(component)}`;
