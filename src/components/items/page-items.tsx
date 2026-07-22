import {
  ListScreen,
  CumUseScreen,
  AboutScreen,
  TermsScreen,
  PrivacyScreen,
  SpeedKatakanaScreen,
  DashboardScreen,
  MasteryScreen,
} from "@/components/screens";
import { RecognitionPracticeV1Screen } from "@/components/recognition-practice-v1";
import { ProductionPracticeV1Screen } from "@/components/production-practice-v1";
import {
  recognitionPracticePageMeta,
  productionPracticePageMeta,
  speedKatakanaPageMeta,
} from "@/lib/pages/practice-pages";
import {
  cumUseGraphPageMeta,
  dashboardPageMeta,
  exploreKanjiPageMeta,
  masteryPageMeta,
} from "@/lib/pages/nav-links";

const kanjiPage = {
  ...exploreKanjiPageMeta,
  Component: ListScreen,
};

const cumUseGraphPage = {
  ...cumUseGraphPageMeta,
  Component: CumUseScreen,
};

const dashboardPage = {
  ...dashboardPageMeta,
  Component: DashboardScreen,
};

const masteryPage = {
  ...masteryPageMeta,
  Component: MasteryScreen,
};

const aboutPage = {
  href: "/about",
  title: "About",
  Component: AboutScreen,
};

const termsPage = {
  href: "/terms",
  title: "Terms of Use",
  Component: TermsScreen,
};

const privacyPage = {
  href: "/privacy",
  title: "Privacy Policy",
  Component: PrivacyScreen,
};

const speedKatakanaPage = {
  ...speedKatakanaPageMeta,
  Component: SpeedKatakanaScreen,
};

const recognitionPracticeV1Page = {
  ...recognitionPracticePageMeta,
  Component: RecognitionPracticeV1Screen,
};

const productionPracticeV1Page = {
  ...productionPracticePageMeta,
  Component: ProductionPracticeV1Screen,
};

const pageItems = {
  kanjiPage,
  cumUseGraphPage,
  dashboardPage,
  masteryPage,
  aboutPage,
  termsPage,
  privacyPage,
  speedKatakanaPage,
  recognitionPracticeV1Page,
  productionPracticeV1Page,
};

export default pageItems;
