import {
  ListScreen,
  CumUseScreen,
  AboutScreen,
  TermsScreen,
  PrivacyScreen,
  SpeedKatakanaScreen,
} from "@/components/screens";
import { RecognitionPracticeV1Screen } from "@/components/recognition-practice-v1";

const kanjiPage = {
  href: "/",
  title: "Explore Kanji",
  Component: ListScreen,
  description: "Advanced search, sort, filter, and usage visualization tool",
};

const cumUseGraphPage = {
  href: "/cumulative-use-graph",
  title: "Cumulative Use Graph",
  description: "Inspect kanji usage vs rank trends",
  Component: CumUseScreen,
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
  href: "/speed-katakana",
  title: "Speed Katakana",
  description: "Practice speed typing katakana words",
  Component: SpeedKatakanaScreen,
};

const recognitionPracticeV1Page = {
  href: "/recognition-practice",
  title: "Recognition Practice",
  description: "Type the reading of kanji anchor words",
  Component: RecognitionPracticeV1Screen,
};

const pageItems = {
  kanjiPage,
  cumUseGraphPage,
  aboutPage,
  termsPage,
  privacyPage,
  speedKatakanaPage,
  recognitionPracticeV1Page,
};

export default pageItems;
