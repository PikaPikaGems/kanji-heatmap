import { FrequencyType } from "../options/options-types";
import {
  K_RANK_AOZORA_CHAR,
  K_RANK_AOZORA_DOC,
  K_RANK_BUNKA,
  K_RANK_DRAMA_SUBTITLES,
  K_RANK_GOOGLE,
  K_RANK_JISHO,
  K_RANK_KD,
  K_RANK_KUF,
  K_RANK_MCD,
  K_RANK_NETFLIX,
  K_RANK_NONE,
  K_RANK_NOVELS_5100,
  K_RANK_ONLINE_NEWS_CHAR,
  K_RANK_ONLINE_NEWS_DOC,
  K_RANK_TWITTER,
  K_RANK_WIKIPEDIA_CHAR,
  K_RANK_WIKIPEDIA_DOC,
  K_RANK_WKFR,
} from "../options/options-constants";

const scriptin_attribute_desc =
  " Compiled by Dmitry Shpika. Converted to Std Comp Rank by @mikong.";
const doc_count_desc =
  "Document count measures how many documents the kanji appears in.";
const char_count_desc =
  "Character count measures how many times the character is used.";
const ultimate_attribute_desc = "Compiled by Patrick Kandrac.";
const ultimate_kanji_links = [
  "https://www.reddit.com/r/LearnJapanese/comments/rji33t/ultimate_kanji_frequency_list/",
  "https://www.researchgate.net/publication/357159664_2242_Kanji_Frequency_List_ver_11",
  "https://docs.google.com/spreadsheets/d/1MBYfKPrlST3F51KIKbAlsGw1x4c_atuHfPwSSRN5sLs/edit?gid=479449032#gid=479449032",
  "https://docs.google.com/spreadsheets/d/1MBYfKPrlST3F51KIKbAlsGw1x4c_atuHfPwSSRN5sLs/edit?gid=496425456#gid=496425456",
];

export const rankTypeLabel = {
  1224: "(Std Comp Rank)",
  1223: "(Dense Rank)",
  "N/A": "",
};

export const FREQ_RANK_SOURCES_INFO: Record<
  FrequencyType,
  { description: string; links: string[]; rankType: "1224" | "1223" | "N/A" }
> = {
  [K_RANK_NETFLIX]: {
    description:
      "Derived from Japanese Netflix subtitles containing about 53M total kanji occurrences. " +
      "Compiled by OhTalkWho オタク (Dave Doebrick) and published in 2019.",
    links: [
      "https://www.youtube.com/watch?v=DwJWld8hW0M",
      "https://www.mediafire.com/folder/mvh6jhwj6xxo6/Frequency_Lists",
      "https://drive.google.com/file/d/1qHEfYHXjEp83i6PxxMlSxluFyQg2W8Up/view",
    ],
    rankType: "1224",
  },
  [K_RANK_DRAMA_SUBTITLES]: {
    description:
      "Derived from 12,277 subtitles from Japanese drama, anime and films containing about 20.5M total kanji occurrences. " +
      "Compiled by Chris Kempson and published in 2019.",
    links: [
      "https://github.com/chriskempson/japanese-subtitles-word-kanji-frequency-lists",
      "https://github.com/Matchoo95/JP-Subtitles",
    ],
    rankType: "1224",
  },
  [K_RANK_NOVELS_5100]: {
    description:
      "Derived from scanning 5100 novels containing about 180M total kanji occurrences. Compiled by Redditor Nukemarine " +
      "and published in 2019.",
    links: [
      "https://drive.google.com/file/d/1zbClv0H5VgswEDAkVmF3ikiVnoi6yGsW/view",
      "https://www.reddit.com/r/LearnJapanese/comments/fhx27j/comment/fkdyksq/",
      "https://drive.google.com/file/d/1SWkufrYEY8Xyyjpt_g-s1Ygqt_XzkHGK/view",
    ],
    rankType: "1224",
  },
  [K_RANK_TWITTER]: {
    description:
      "Derived from Twitter messages collected last June 2015 containing about 10M total kanji occurrences. " +
      scriptin_attribute_desc,
    links: [
      "https://github.com/scriptin/kanji-frequency/tree/master/data2015",
      "https://github.com/scriptin/kanji-frequency/blob/master/data2015/data/twitter.json",
    ],
    rankType: "1224",
  },
  [K_RANK_WIKIPEDIA_DOC]: {
    description:
      "Derived from 100,000 Wikipedia articles sampled in 2023 and contained 59M total kanji occurrences. " +
      doc_count_desc +
      scriptin_attribute_desc,
    links: ["https://scriptin.github.io/kanji-frequency/wikipedia/"],
    rankType: "1224",
  },
  [K_RANK_WIKIPEDIA_CHAR]: {
    description:
      "Derived from 100,000 Wikipedia articles sampled in 2023 and contained 59M total kanji occurrences. " +
      char_count_desc +
      scriptin_attribute_desc,
    links: ["https://scriptin.github.io/kanji-frequency/wikipedia/"],
    rankType: "1224",
  },
  [K_RANK_ONLINE_NEWS_DOC]: {
    description:
      "Derived from over 3,700 articles from Japanese Wikinews that were published from 2005 to 2023 and " +
      "contained 1.1M total kanji occurrences. " +
      doc_count_desc +
      scriptin_attribute_desc,
    links: ["https://scriptin.github.io/kanji-frequency/news/"],
    rankType: "1224",
  },
  [K_RANK_ONLINE_NEWS_CHAR]: {
    description:
      "Derived from over 3,700 articles from Japanese Wikinews that were published from 2005 to 2023 and " +
      "contained 1.1M total kanji occurrences. " +
      char_count_desc +
      scriptin_attribute_desc,
    links: ["https://scriptin.github.io/kanji-frequency/news/"],
    rankType: "1224",
  },
  [K_RANK_AOZORA_DOC]: {
    description:
      "Derived from over 17,000 books from Aozora Bunko, the vast majority of which are more than 70 " +
      "years old, and contained 67.8M total kanji occurrences. " +
      doc_count_desc +
      scriptin_attribute_desc,
    links: ["https://scriptin.github.io/kanji-frequency/aozora/"],
    rankType: "1224",
  },
  [K_RANK_AOZORA_CHAR]: {
    description:
      "Derived from over 17,000 books from Aozora Bunko, the vast majority of which are more than 70 " +
      "years old, and contained 67.8M total kanji occurrences. " +
      char_count_desc +
      scriptin_attribute_desc,
    links: ["https://scriptin.github.io/kanji-frequency/aozora/"],
    rankType: "1224",
  },
  [K_RANK_GOOGLE]: {
    description:
      "Kouji Shibano's Google Kanji Data from 2009 that processed 133B kanji occurrences. " +
      ultimate_attribute_desc,
    links: ultimate_kanji_links,
    rankType: "1223",
  },
  [K_RANK_KUF]: {
    description:
      "Kanji Usage Frequency (KUF) from 2016 that processed 850M kanji occurrences from Wikipedia, Aozora, " +
      "e-news, Twitter. " +
      ultimate_attribute_desc,
    links: ultimate_kanji_links,
    rankType: "1223",
  },
  [K_RANK_MCD]: {
    description:
      "Matsushita's Character Database (MCD) from 2014 that processed 33M words from sources The Balanced " +
      "Corpus of Contemporary Written Japanese (BCCWJ) and Yahoo知恵袋 aka Japanese Yahoo Answer. " +
      ultimate_attribute_desc,
    links: ultimate_kanji_links,
    rankType: "1223",
  },
  [K_RANK_BUNKA]: {
    description:
      "Published by the Japanese Agency for Cultural Affairs (文化庁) in 2010 that processed 1.45M kanji from " +
      "various sources including books, magazines, textbooks, newspapers such as Asahi and Yomiuri, websites, etc. " +
      ultimate_attribute_desc,
    links: ultimate_kanji_links,
    rankType: "1223",
  },
  [K_RANK_JISHO]: {
    description:
      "Jisho.org uses Alexandre Girardi's word frequency list published in 1998 that used 300,000 words found " +
      "in 4 years of the Mainichi Newpaper. " +
      ultimate_attribute_desc,
    links: ultimate_kanji_links,
    rankType: "1223",
  },
  [K_RANK_KD]: {
    description:
      "The Kanji Database (KD) or kanjidatabase.com frequency list for the 2,136 Jouyou kanji analyzed " +
      "about 300M kanji occurrences published in the Mainichi Newspaper from 2000 to 2010. " +
      ultimate_attribute_desc,
    links: ultimate_kanji_links,
    rankType: "1223",
  },
  [K_RANK_WKFR]: {
    description:
      "Alex Yatskov's Wikipedia Kanji Frequency Report (WKFR) published in 2010 analyzed more than 500M " +
      "kanji occurrences. " +
      ultimate_attribute_desc,
    links: ultimate_kanji_links,
    rankType: "1223",
  },
  [K_RANK_NONE]: {
    description: "Do not select any frequency data source.",
    links: [],
    rankType: "N/A",
  },
};
