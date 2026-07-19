import { practicePageLinks } from "@/lib/pages/practice-pages";

const PRACTICE_PATHS = new Set<string>(
  practicePageLinks.map((page) => page.href)
);

let returnHref = "/";

export const isPracticePath = (path: string) => PRACTICE_PATHS.has(path);

/** Remember where to return when leaving a practice start screen. */
export const rememberPracticeReturnHref = (href: string) => {
  const path = href.split("?")[0] || "/";
  if (isPracticePath(path)) return;
  if (href === returnHref) return;
  returnHref = href || "/";
};

export const getPracticeReturnHref = () => returnHref;
