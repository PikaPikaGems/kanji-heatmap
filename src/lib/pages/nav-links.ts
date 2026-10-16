import {
  Eye,
  GraduationCap,
  Keyboard,
  LayoutDashboard,
  PencilLine,
  PenLine,
  Puzzle,
  ScanEye,
  SearchIcon,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import {
  fillTheKanjiPageMeta,
  productionPracticePageMeta,
  readingMasteryPageMeta,
  recognitionPracticePageMeta,
  speedKatakanaPageMeta,
  writingMasteryPageMeta,
} from "@/lib/pages/practice-pages";

export type NavLinkIcon = ComponentType<
  SVGProps<SVGSVGElement> & { className?: string }
>;

export type NavLinkItem = {
  href: string;
  title: string;
  description: string;
  Icon: NavLinkIcon;
  /** Appends a ⭐️ after the title in the sidebar and FAB menus. */
  starred?: boolean;
};

/** A group of menu links under an optional small heading. */
export type NavLinkSection = {
  heading?: string;
  links: NavLinkItem[];
};

export const exploreKanjiPageMeta = {
  href: "/",
  title: "Explore Kanji",
  description: "Advanced search, sort, filter, and usage visualization tool",
} as const;

export const cumUseGraphPageMeta = {
  href: "/cumulative-use-graph",
  title: "Cumulative Use Graph",
  description: "Inspect kanji usage vs rank trends",
} as const;

export const dashboardPageMeta = {
  href: "/dashboard",
  title: "Dashboard",
  description: "Activity stats, calendar, and progress breakdowns",
} as const;

export const masteryPageMeta = {
  href: "/mastery",
  title: "Visualize Mastery",
  description: "See how well you know each kanji — coming soon",
} as const;

/** Bottom floating island tabs (Dashboard / Explore / Mastery). */
export const floatingIslandNavLinks: NavLinkItem[] = [
  { ...dashboardPageMeta, Icon: LayoutDashboard },
  { ...exploreKanjiPageMeta, Icon: SearchIcon },
  { ...masteryPageMeta, Icon: GraduationCap },
];

// Menu entries (sidebar + practice FAB). `starred` appends the ⭐️ after the
// title; the floating island tabs above stay plain.
const visualizeMasteryNavLink: NavLinkItem = {
  ...masteryPageMeta,
  Icon: GraduationCap,
  starred: true,
};

const readingMasteryNavLink: NavLinkItem = {
  ...readingMasteryPageMeta,
  Icon: ScanEye,
  starred: true,
};

const writingMasteryNavLink: NavLinkItem = {
  ...writingMasteryPageMeta,
  Icon: PencilLine,
  starred: true,
};

/** Practice destinations in the FAB menu; the sidebar repeats them. */
export const practiceNavSections: NavLinkSection[] = [
  {
    heading: "Kanji Mastery",
    links: [readingMasteryNavLink, writingMasteryNavLink],
  },
  {
    heading: "Practice Games",
    links: [
      { ...recognitionPracticePageMeta, Icon: Eye },
      { ...productionPracticePageMeta, Icon: PenLine },
      { ...fillTheKanjiPageMeta, Icon: Puzzle },
      { ...speedKatakanaPageMeta, Icon: Keyboard },
    ],
  },
];

/** Primary destinations in the header drawer. */
export const headerNavSections: NavLinkSection[] = [
  {
    links: [
      { ...exploreKanjiPageMeta, Icon: SearchIcon },
      { ...dashboardPageMeta, Icon: LayoutDashboard },
      visualizeMasteryNavLink,
    ],
  },
  ...practiceNavSections,
];
