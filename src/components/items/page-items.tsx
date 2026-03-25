import {
  ListScreen,
  CumUseScreen,
  AboutScreen,
  TermsScreen,
  PrivacyScreen,
} from "@/components/screens";

const kanjiPage = {
  href: "/",
  title: "Explore Kanji",
  Component: ListScreen,
  description: "Advanced search, sort, filter, and usage visualization tool",
};

const cumUseGraphPage = {
  href: "/cumulative-use-graph",
  title: "Cumulative Use Graph",
  description: "Inspect kanji usage vs rank trends across various data sets",
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

const pageItems = {
  kanjiPage,
  cumUseGraphPage,
  aboutPage,
  termsPage,
  privacyPage,
};

export default pageItems;
