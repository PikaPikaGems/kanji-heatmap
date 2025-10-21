export const externalLinks: { name: string; url: (x: string) => string }[] = [
  { name: "JPDB", url: (kanji: string) => `https://jpdb.io/kanji/${kanji}#a` },
  {
    name: "Jotoba",
    url: (kanji: string) => `https://jotoba.de/search/1/${kanji}?l=en-US`,
  },
  {
    name: "The Kanji Map",
    url: (kanji: string) => `https://thekanjimap.com/${kanji}`,
  },
  {
    name: "Jisho",
    url: (kanji: string) => `https://jisho.org/search/${kanji}%20%23kanji`,
  },
  {
    name: "Kai",
    url: (kanji: string) => `https://kai.kanjiapi.dev/#!/${kanji}`,
  },
  {
    name: "Kanshudo",
    url: (kanji: string) => `https://www.kanshudo.com/kanji/${kanji}`,
  },
  {
    name: "Kanji Alive",
    url: (kanji: string) => `https://app.kanjialive.com/${kanji}`,
  },
  {
    name: "Hochanh",
    url: (kanji: string) => `https://hochanh.github.io/rtk/${kanji}/index.html`,
  },
  {
    name: "Wanikani",
    url: (kanji: string) => `https://www.wanikani.com/kanji/${kanji}`,
  },
  {
    name: "Kanji Garden",
    url: (kanji: string) => `https://kanji.garden/kanji?kanji=${kanji}`,
  },
  {
    name: "Wiktionary",
    url: (kanji: string) => `https://en.wiktionary.org/wiki/${kanji}`,
  },
  {
    name: "Hanziyuan",
    url: (kanji: string) => `https://hanziyuan.net/#${kanji}`,
  },
  {
    name: "Kakimashou",
    url: (kanji: string) =>
      `https://www.kakimashou.com/dictionary/character/${kanji}`,
  },
  {
    name: "Ichi Moe",
    url: (kanji: string) => `https://ichi.moe/cl/kanji/?q=${kanji}`,
  },
  {
    name: "Jitenon",
    url: (kanji: string) => `https://jitenon.com/kanji/${kanji}`,
  },
  {
    name: "Takoboto",
    url: (kanji: string) => `https://takoboto.jp/?q=${kanji}`,
  },
  {
    name: "JLearn",
    url: (kanji: string) => `https://jlearn.net/search/${kanji}`,
  },
  {
    name: "Niai Mrahhal",
    url: (kanji: string) => `https://niai.mrahhal.net/similar?q=${kanji}`,
  },
  {
    name: "Kurumi Kanji Explosion",
    url: (kanji: string) => `https://kurumi.com/jp/kjbh/?k=${kanji}`,
  },
  {
    name: "Uchiwakekanji Explosion",
    url: (kanji: string) => `https://uchiwakekanji.github.io/jp/?k=${kanji}`,
  },
  {
    name: "Romaji Desu",
    url: (kanji: string) => `https://www.romajidesu.com/kanji/${kanji}`,
  },
  {
    name: "Kyou Benkyou",
    url: (kanji: string) => `https://www.kyoubenkyou.com/search/${kanji}`,
  },
  {
    name: "Kanjiverse",
    url: (kanji: string) => `https://app.kanjiverse.com/kanji/${kanji}`,
  },
  {
    name: "Lorenzi's Jisho",
    url: (kanji: string) => `https://jisho.hlorenzi.com/search/${kanji}%20%23k`,
  },
];

export const outLinks = {
  githubIssue: "https://github.com/PikaPikaGems/kanji-heatmap/issues/63",
  githubContentIssue:
    "https://github.com/PikaPikaGems/kanji-heatmap-data/issues/5",
  koFi: "https://ko-fi.com/minimithi",
  discord: "https://discord.gg/Ash8ZrGb4s",
  ririkku: `https://demo.ririkku.com/?utm_source=kanjiheatmap"`,
};

export const otherOutLinks = {
  webSpeechApi:
    "https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis",
  jmdictFurigana: "https://github.com/Doublevil/JmdictFurigana",
};

export const vocabExternalLinks = [
  {
    name: "Immersion Kit",
    url: (word: string) =>
      `https://www.immersionkit.com/dictionary?keyword=${word}`,
  },
  {
    name: "Tatoeba",
    url: (word: string) =>
      `https://tatoeba.org/en/sentences/search?from=jpn&query=${word}&to=eng`,
  },
  {
    name: "Jisho.org",
    url: (word: string) => `https://jisho.org/word/${word}`,
  },
  {
    name: "Jotoba",
    url: (word: string) => `https://jotoba.de/search/0/${word}?l=en-US`,
  },
  {
    name: "JPDB.io",
    url: (word: string) => `https://jpdb.io/search?q=${word}&lang=english#a`,
  },
  {
    name: "Kanshudo",
    url: (word: string) => `https://www.kanshudo.com/searchw?q=${word}`,
  },
  {
    name: "JLearn",
    url: (word: string) => `https://jlearn.net/dictionary/${word}`,
  },
  {
    name: "Takoboto",
    url: (word: string) => `https://takoboto.jp/?q=${word}`,
  },
  {
    name: "Ichi Moe",
    url: (word: string) => `https://ichi.moe/cl/word/?q=${word}`,
  },
  {
    name: "Kakimashou",
    url: (word: string) => `https://www.kakimashou.com/dictionary/word/${word}`,
  },
  {
    name: "Sentence Search",
    url: (word: string) => `https://sentencesearch.neocities.org/#${word}`,
  },
  {
    name: "Draw Me a Kanji",
    url: (word: string) => `https://mbilbille.github.io/dmak/#${word}`,
  },
];
