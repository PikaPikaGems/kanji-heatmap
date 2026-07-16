import {
  ChartLine,
  Eye,
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
} from "@/components/items/practice-pages";

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

/** Practice destinations shown in the FAB menu. */
export const practiceNavLinks: NavLinkItem[] = [
  { ...recognitionPracticePageMeta, Icon: Eye },
  { ...productionPracticePageMeta, Icon: PenLine },
  { ...speedKatakanaPageMeta, Icon: Keyboard },
];

/** Primary destinations in the header drawer. */
export const headerNavLinks: NavLinkItem[] = [
  { ...exploreKanjiPageMeta, Icon: SearchIcon },
  { ...dashboardPageMeta, Icon: LayoutDashboard },
  { ...recognitionPracticePageMeta, Icon: Eye },
  { ...productionPracticePageMeta, Icon: PenLine },
  { ...speedKatakanaPageMeta, Icon: Keyboard },
  { ...cumUseGraphPageMeta, Icon: ChartLine },
];
