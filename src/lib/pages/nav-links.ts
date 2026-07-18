import {
  ChartLine,
  Eye,
  GraduationCap,
  Keyboard,
  LayoutDashboard,
  PenLine,
  SearchIcon,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import {
  productionPracticePageMeta,
  recognitionPracticePageMeta,
  speedKatakanaPageMeta,
} from "@/lib/pages/practice-pages";

export type NavLinkIcon = ComponentType<
  SVGProps<SVGSVGElement> & { className?: string }
>;

export type NavLinkItem = {
  href: string;
  title: string;
  description: string;
  Icon: NavLinkIcon;
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

/** Practice destinations shown in the FAB menu. */
export const practiceNavLinks: NavLinkItem[] = [
  { ...recognitionPracticePageMeta, Icon: Eye },
  { ...productionPracticePageMeta, Icon: PenLine },
  { ...speedKatakanaPageMeta, Icon: Keyboard },
];

/** Bottom floating island tabs (Dashboard / Explore / Mastery). */
export const floatingIslandNavLinks: NavLinkItem[] = [
  { ...dashboardPageMeta, Icon: LayoutDashboard },
  { ...exploreKanjiPageMeta, Icon: SearchIcon },
  { ...masteryPageMeta, Icon: GraduationCap },
];

/** Primary destinations in the header drawer. */
export const headerNavLinks: NavLinkItem[] = [
  { ...exploreKanjiPageMeta, Icon: SearchIcon },
  { ...dashboardPageMeta, Icon: LayoutDashboard },
  { ...masteryPageMeta, Icon: GraduationCap },
  { ...recognitionPracticePageMeta, Icon: Eye },
  { ...productionPracticePageMeta, Icon: PenLine },
  { ...speedKatakanaPageMeta, Icon: Keyboard },
  { ...cumUseGraphPageMeta, Icon: ChartLine },
];
