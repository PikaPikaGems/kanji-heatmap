import { useEngineState } from "@/lib/engine/engine";
import type { DueCounts } from "@/lib/engine/use-due-count";
import type { NavLinkItem } from "@/lib/pages/nav-links";
import {
  readingMasteryPageMeta,
  writingMasteryPageMeta,
} from "@/lib/pages/practice-pages";

const MASTERY_HREFS: ReadonlySet<string> = new Set([
  readingMasteryPageMeta.href,
  writingMasteryPageMeta.href,
]);

/**
 * Drops the mastery links when this build has no study engine; nav-links.ts
 * itself stays static.
 */
export const useVisibleNavLinks = (links: NavLinkItem[]): NavLinkItem[] => {
  const engine = useEngineState();
  if (engine.status === "unavailable" && engine.reason === "not-included") {
    return links.filter((link) => !MASTERY_HREFS.has(link.href));
  }
  return links;
};

/** Mastery links whose card type has reviews due (they get the due dot). */
export const dueNavHrefs = (counts: DueCounts | null): ReadonlySet<string> => {
  const hrefs = new Set<string>();
  if (counts && counts.reading > 0) hrefs.add(readingMasteryPageMeta.href);
  if (counts && counts.writing > 0) hrefs.add(writingMasteryPageMeta.href);
  return hrefs;
};
