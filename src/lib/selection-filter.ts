export const isSelectionFilterActive = (
  selectedCount: number,
  optionCount: number
) => selectedCount > 0 && selectedCount < optionCount;

export const matchesSelectionFilter = <T>(
  selected: Set<T>,
  optionCount: number,
  value: T
) =>
  !isSelectionFilterActive(selected.size, optionCount) || selected.has(value);
