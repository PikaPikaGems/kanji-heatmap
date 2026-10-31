import {
  Brain,
  ChartSpline,
  Eye,
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
  readingMastery2PageMeta,
  readingMasteryPageMeta,
  recognitionPractice2PageMeta,
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
  /** The full name when `title` is short, e.g. "Writing" under "Practice". */
  ariaLabel?: string;
};

/** A group of menu links under an optional small heading. */
export type NavLinkSection = {
  heading?: string;
  /** Appends a ⭐️ after the heading (the section needs the study engine). */
  starred?: boolean;
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
  description: "See how well you know each kanji",
} as const;

/** Bottom floating island tabs (Dashboard / Explore / Mastery). */
export const floatingIslandNavLinks: NavLinkItem[] = [
  { ...dashboardPageMeta, Icon: LayoutDashboard },
  { ...exploreKanjiPageMeta, Icon: SearchIcon },
  { ...masteryPageMeta, Icon: Brain },
];

// Menu entries (sidebar + practice FAB). The mastery links carry no star of
// their own; their "Kanji Mastery" heading (or "Mastery" column) does.
const writingPracticeNavLink: NavLinkItem = {
  ...productionPracticePageMeta,
  Icon: PenLine,
};
const readingPracticeNavLink: NavLinkItem = {
  ...recognitionPracticePageMeta,
  Icon: Eye,
};
const readingPractice2NavLink: NavLinkItem = {
  ...recognitionPractice2PageMeta,
  Icon: Eye,
};
const writingMasteryNavLink: NavLinkItem = {
  ...writingMasteryPageMeta,
  Icon: PencilLine,
};
const readingMasteryNavLink: NavLinkItem = {
  ...readingMasteryPageMeta,
  Icon: ScanEye,
};
const readingMastery2NavLink: NavLinkItem = {
  ...readingMastery2PageMeta,
  Icon: ScanEye,
};

/** The games that aren't a skill's practice: Fill in the Kanji, Speed Katakana. */
export const moreGamesNavLinks: NavLinkItem[] = [
  { ...fillTheKanjiPageMeta, Icon: Puzzle },
  { ...speedKatakanaPageMeta, Icon: Keyboard },
];

const practiceGamesSection: NavLinkSection = {
  heading: "Practice Games",
  links: [
    ...moreGamesNavLinks,
    writingPracticeNavLink,
    readingPracticeNavLink,
    readingPractice2NavLink,
  ],
};

/** A link titled by its skill alone; its column heading names the mode. */
const skillLink = (item: NavLinkItem, skill: string): NavLinkItem => ({
  ...item,
  title: skill,
  ariaLabel: item.title,
});

/**
 * The practice FAB's two columns, Practice and Mastery ⭐️, each with a
 * button per skill. The skill names match the dashboard heatmap's
 * checkboxes.
 */
export const practiceFabColumns: NavLinkSection[] = [
  {
    heading: "Practice",
    links: [
      skillLink(writingPracticeNavLink, "Writing"),
      skillLink(readingPracticeNavLink, "Reading I"),
      skillLink(readingPractice2NavLink, "Reading II"),
    ],
  },
  {
    heading: "Mastery",
    starred: true,
    links: [
      skillLink(writingMasteryNavLink, "Writing"),
      skillLink(readingMasteryNavLink, "Reading I"),
      skillLink(readingMastery2NavLink, "Reading II"),
    ],
  },
];

/** Primary destinations in the header drawer. */
export const headerNavSections: NavLinkSection[] = [
  {
    heading: "Explore & Track",
    links: [
      { ...exploreKanjiPageMeta, Icon: SearchIcon },
      { ...dashboardPageMeta, Icon: LayoutDashboard },
      { ...cumUseGraphPageMeta, Icon: ChartSpline },
    ],
  },
  {
    heading: "Kanji Mastery",
    starred: true,
    links: [
      { ...masteryPageMeta, Icon: Brain },
      writingMasteryNavLink,
      readingMasteryNavLink,
      readingMastery2NavLink,
    ],
  },
  practiceGamesSection,
];
