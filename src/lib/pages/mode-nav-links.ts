import { useEngineState } from "@/lib/engine/engine";
import type { DueCounts } from "@/lib/engine/use-due-count";
import { masteryPageMeta, type NavLinkSection } from "@/lib/pages/nav-links";
import {
  readingMasteryPageMeta,
  writingMasteryPageMeta,
} from "@/lib/pages/practice-pages";

const MASTERY_HREFS: ReadonlySet<string> = new Set([
  masteryPageMeta.href,
  readingMasteryPageMeta.href,
  writingMasteryPageMeta.href,
]);

/**
 * Drops the mastery links (Visualize, Reading, Writing) when this build has no
 * study engine, and any section that leaves empty (so "Kanji Mastery"
 * disappears with them); nav-links.ts itself stays static.
 */
export const useVisibleNavSections = (
  sections: NavLinkSection[]
): NavLinkSection[] => {
  const engine = useEngineState();
  if (engine.status === "unavailable" && engine.reason === "not-included") {
    return sections
      .map((section) => ({
        ...section,
        links: section.links.filter((link) => !MASTERY_HREFS.has(link.href)),
      }))
      .filter((section) => section.links.length > 0);
  }
  return sections;
};

/** Mastery links whose card type has reviews due (they get the due dot). */
export const dueNavHrefs = (counts: DueCounts | null): ReadonlySet<string> => {
  const hrefs = new Set<string>();
  if (counts && counts.reading > 0) hrefs.add(readingMasteryPageMeta.href);
  if (counts && counts.writing > 0) hrefs.add(writingMasteryPageMeta.href);
  return hrefs;
};
