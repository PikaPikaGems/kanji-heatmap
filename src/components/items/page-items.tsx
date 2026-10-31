import {
  ListScreen,
  CumUseScreen,
  AboutScreen,
  TermsScreen,
  PrivacyScreen,
  SpeedKatakanaScreen,
  FillTheKanjiScreen,
  DashboardScreen,
  MasteryScreen,
} from "@/components/screens";
import {
  RecognitionPracticeV1Screen,
  RecognitionPractice2Screen,
} from "@/components/recognition-practice-v1";
import { ProductionPracticeV1Screen } from "@/components/production-practice-v1";
import {
  ReadingMasteryScreen,
  ReadingMastery2Screen,
  WritingMasteryScreen,
} from "@/components/mastery-review";
import {
  recognitionPracticePageMeta,
  recognitionPractice2PageMeta,
  productionPracticePageMeta,
  readingMasteryPageMeta,
  readingMastery2PageMeta,
  writingMasteryPageMeta,
  speedKatakanaPageMeta,
  fillTheKanjiPageMeta,
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

const fillTheKanjiPage = {
  ...fillTheKanjiPageMeta,
  Component: FillTheKanjiScreen,
};

const recognitionPracticeV1Page = {
  ...recognitionPracticePageMeta,
  Component: RecognitionPracticeV1Screen,
};

const recognitionPractice2Page = {
  ...recognitionPractice2PageMeta,
  Component: RecognitionPractice2Screen,
};

const productionPracticeV1Page = {
  ...productionPracticePageMeta,
  Component: ProductionPracticeV1Screen,
};

const readingMasteryPage = {
  ...readingMasteryPageMeta,
  Component: ReadingMasteryScreen,
};

const readingMastery2Page = {
  ...readingMastery2PageMeta,
  Component: ReadingMastery2Screen,
};

const writingMasteryPage = {
  ...writingMasteryPageMeta,
  Component: WritingMasteryScreen,
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
  fillTheKanjiPage,
  recognitionPracticeV1Page,
  recognitionPractice2Page,
  productionPracticeV1Page,
  readingMasteryPage,
  readingMastery2Page,
  writingMasteryPage,
};

export default pageItems;
