/**
 * sph-mn's component table (`public/json/v2/sphmn_components.json`, built by
 * scripts/sphmn-components.mjs). The file lists each component with every
 * shipped kanji containing it, at any depth, in drawer order: most matches
 * first. See raw-data/radicals/README.md, "sph-mn components".
 */
export type SphmnComponentsFile = [component: string, kanji: string][];

export type SphmnComponents = {
  /** Every component, in drawer order. */
  order: string[];
  /** Component → the kanji that contain it, not counting itself. */
  kanjiOf: Record<string, string[]>;
  /**
   * Kanji → what component search matches it by: every component inside
   * it, plus the kanji itself when it is a component (寺 finds 寺).
   */
  searchIndex: Record<string, Set<string>>;
};

export const prepareSphmnComponents = (
  file: SphmnComponentsFile
): SphmnComponents => {
  const order: string[] = [];
  const kanjiOf: Record<string, string[]> = {};
  const searchIndex: Record<string, Set<string>> = {};
  const indexOf = (kanji: string) => (searchIndex[kanji] ??= new Set());

  for (const [component, kanji] of file) {
    order.push(component);
    kanjiOf[component] = [...kanji];
    for (const char of kanjiOf[component]) indexOf(char).add(component);
  }
  // Only a component that is also a kanji can be a search result, and only
  // shipped kanji ever reach searchByParts, so adding every component is safe.
  for (const component of order) indexOf(component).add(component);

  return { order, kanjiOf, searchIndex };
};

/**
 * Every component inside `kanji`, most-used first (drawer order). Not the
 * kanji itself.
 */
export const sphmnPartsOf = (kanji: string, data: SphmnComponents) =>
  data.order.filter(
    (component) =>
      component !== kanji && data.searchIndex[kanji]?.has(component)
  );
