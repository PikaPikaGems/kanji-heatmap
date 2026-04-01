import { CustomLink } from "@/components/common/docs/CustomLink";

export const AboutSection = () => {
  return (
    <article>
      <h1 className="mb-6 text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl">
        About
      </h1>
      <p className="my-5 leading-7">
        Kanji Heatmap is an exploration tool with advanced filtering, sorting,
        frequency heatmap visualizations, and detailed kanji information. This
        tool can help you prioritize which kanji to learn based on your specific
        goals.
      </p>
      <p className="my-5 leading-7">
        The kanji you encounter in casual Twitter posts differ from those found
        in literary works, and the kanji commonly used in TV dramas may vary
        from those in news articles.
      </p>
      <p className="my-5 leading-7">
        Visual learners will appreciate the heatmap feature, which highlights
        more frequently used kanji in brighter colors, with less common
        characters shown in progressively duller shades.{" "}
      </p>
      <p className="my-5 leading-7">
        Unlike many kanji resources that display characters in a single style,
        Kanji Heatmap lets you change fonts to see how the appearance of
        characters can vary.
      </p>
      <p className="my-5 leading-7">
        While Kanji Heatmap is not a dictionary, it offers useful kanji details.
        Simply click on any kanji to view sample words, meanings, onyomi and
        kunyomi readings, stroke order animations, component breakdowns, and
        more.
      </p>

      <h2 className="pb-2 mt-10 mb-4 text-3xl font-semibold tracking-tight border-b scroll-m-20 first:mt-0">
        License
      </h2>
      <p className="mb-4 leading-7">
        The data published in kanjiheatmap.com by PikaPikaGems are licensed
        under{" "}
        <CustomLink href="https://creativecommons.org/licenses/by-sa/4.0/">
          CC BY-SA 4.0
        </CustomLink>
        .
      </p>
      <h2 className="pb-2 mt-10 mb-4 text-3xl font-semibold tracking-tight border-b scroll-m-20 first:mt-0">
        Credits
      </h2>
      <h3 className="mt-8 mb-4 text-2xl font-semibold tracking-tight scroll-m-20">
        Data Sources
      </h3>
      <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
        <li>
          <CustomLink href="http://kanjivg.tagaini.net/">KanjiVG</CustomLink>{" "}
          project by Ulrich Apel under{" "}
          <CustomLink href="https://creativecommons.org/licenses/by-sa/3.0">
            CC BY-SA 3.0
          </CustomLink>
        </li>
        <li>
          Dmitry {"Shpika's"} projects under{" "}
          <CustomLink href="https://creativecommons.org/licenses/by/4.0/">
            CC BY 4.0
          </CustomLink>
          :
          <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
            <li>
              <CustomLink href="https://github.com/scriptin/kanji-keys/">
                Kanji Keys
              </CustomLink>
            </li>
            <li>
              <CustomLink href="https://github.com/scriptin/topokanji">
                TopoKanji
              </CustomLink>{" "}
              that used data from:
              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>
                  <CustomLink href="https://github.com/amake/cjk-decomp">
                    CJK Decompositions Data
                  </CustomLink>{" "}
                  project
                </li>
              </ul>
            </li>
            <li>
              <CustomLink href="https://scriptin.github.io/kanji-frequency/">
                Kanji Frequency
              </CustomLink>
            </li>
          </ul>
        </li>
        <li>
          <CustomLink href="https://www.reddit.com/r/LearnJapanese/comments/fhx27j/comment/fkdyksq">
            Redditor {"Nukemarine's"}
          </CustomLink>{" "}
          data:
          <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
            <li>
              <CustomLink href="https://drive.google.com/file/d/1zbClv0H5VgswEDAkVmF3ikiVnoi6yGsW/view">
                Kanji Frequency Report
              </CustomLink>
            </li>
            <li>
              <CustomLink href="https://drive.google.com/file/d/1SWkufrYEY8Xyyjpt_g-s1Ygqt_XzkHGK/view">
                Frequency Group Sorted by RTK
              </CustomLink>
            </li>
          </ul>
        </li>
        <li>
          David {"Gouveia's"}{" "}
          <CustomLink href="https://github.com/davidluzgouveia/kanji-data">
            Kanji Data
          </CustomLink>{" "}
          project
          <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
            <li>
              Jouyou kanji list with relevant data from:
              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>
                  <CustomLink href="https://www.edrdg.org/wiki/index.php/KANJIDIC_Project">
                    KANJIDIC
                  </CustomLink>{" "}
                  project
                </li>
                <li>
                  <CustomLink href="https://www.tanos.co.uk/jlpt/">
                    Jonathan {"Waller's "}JLPT Resources
                  </CustomLink>
                </li>
              </ul>
            </li>
          </ul>
        </li>
        <li>
          <CustomLink href="https://ricoapps.com/">
            Shirabe {"Jisho's"}
          </CustomLink>{" "}
          data:
          <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
            <li>Kanji lists by JLPT</li>
            <li>Common Words list</li>
            <li>
              from{" "}
              <CustomLink href="https://www.edrdg.org/">{"EDRDG's"}</CustomLink>{" "}
              projects and{" "}
              <CustomLink href="https://www.tanos.co.uk/jlpt/">
                Jonathan {"Waller's"} JLPT resources
              </CustomLink>
            </li>
          </ul>
        </li>
        <li>
          <CustomLink href="https://www.wanikani.com/">WaniKani</CustomLink> (
          <CustomLink href="https://www.wanikani.com/terms">
            Terms of Service
          </CustomLink>
          )
        </li>
        <li>
          Drew {"Edwards'"}{" "}
          <CustomLink href="https://github.com/Lemmmy/KanjiSchool">
            Kanji School
          </CustomLink>{" "}
          project
          <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
            <li>
              Kanji {"School's"} kanji data is from{" "}
              <CustomLink href="https://jisho.org/">Jisho.org</CustomLink>
              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>
                  Jisho.org data is from the{" "}
                  <CustomLink href="https://www.edrdg.org/wiki/index.php/KANJIDIC_Project">
                    KANJIDIC
                  </CustomLink>{" "}
                  project
                </li>
              </ul>
            </li>
          </ul>
        </li>
        <li>
          <CustomLink href="https://kanjiapi.dev/">kanjiapi.dev</CustomLink>{" "}
          which uses data from:
          <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
            <li>
              <CustomLink href="https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project">
                EDICT
              </CustomLink>
            </li>
            <li>
              <CustomLink href="https://www.edrdg.org/wiki/index.php/KANJIDIC_Project">
                KANJIDIC
              </CustomLink>
            </li>
          </ul>
        </li>
        <li>
          <CustomLink href="https://learnjapanese.moe/kanjiphonetics/">
            Usagi Chan Kanji Phonetics Deck
          </CustomLink>{" "}
          by{" "}
          <CustomLink href="https://www.patreon.com/shoui">shoui520</CustomLink>
        </li>
        <li>
          <CustomLink href="https://github.com/Doublevil/JmdictFurigana">
            JmdictFurigana
          </CustomLink>{" "}
          project under{" "}
          <CustomLink href="https://creativecommons.org/licenses/by-sa/4.0/">
            CC BY-SA 4.0
          </CustomLink>
        </li>
        <li>
          <CustomLink href="https://www.mediafire.com/folder/mvh6jhwj6xxo6/Frequency_Lists">
            Netflix Japanese Frequency List
          </CustomLink>{" "}
          by{" "}
          <CustomLink href="https://www.youtube.com/watch?v=DwJWld8hW0M">
            OhTalkWho オタク
          </CustomLink>{" "}
          (Dave Doebrick)
        </li>
        <li>
          Chris{" Kempson's"}{" "}
          <CustomLink href="https://github.com/chriskempson/japanese-subtitles-word-kanji-frequency-lists">
            Japanese Subtitles Word & Kanji Frequency Lists
          </CustomLink>{" "}
          project under{" "}
          <CustomLink href="https://opensource.org/licenses/MIT">
            MIT
          </CustomLink>
        </li>
        <li>
          Patrick{" Kandrac's"} 2242 Kanji Frequency List (
          <CustomLink href="https://docs.google.com/spreadsheets/d/1MBYfKPrlST3F51KIKbAlsGw1x4c_atuHfPwSSRN5sLs/edit">
            1
          </CustomLink>
          ,{" "}
          <CustomLink href="https://www.researchgate.net/publication/357159664_2242_Kanji_Frequency_List_ver_11">
            2
          </CustomLink>
          ) which sources data from:
          <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
            <li>Kouji {"Shibano's"} Google Kanji Data</li>
            <li>Kanji Usage Frequency (KUF)</li>
            <li>{"Matsushita's"} Character Database (MCD)</li>
            <li>
              Japanese{" "}
              <CustomLink href="https://www.bunka.go.jp/english/">
                Agency for Cultural Affairs (文化庁)
              </CustomLink>
            </li>
            <li>
              Alexandre{" Girardi's"} word frequency list
              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>
                  public domain (see Girardi section in{" "}
                  <CustomLink href="http://ftp.usf.edu/pub/ftp.monash.edu.au/pub/nihongo/">
                    Monash FTP Archive
                  </CustomLink>
                  )
                </li>
              </ul>
            </li>
            <li>
              <CustomLink href="https://www.kanjidatabase.com/">
                kanjidatabase.com
              </CustomLink>
            </li>
            <li>Alex {"Yatskov's"} Wikipedia Kanji Frequency Report</li>
          </ul>
        </li>
        <li>
          Data sources not listed here are credited either in the relevant sections of the website where they are used or in the
          <CustomLink href="https://github.com/PikaPikaGems/kanji-heatmap-data">
            Kanji Heatmap Data
          </CustomLink>
          repository.
        </li>
      </ul>
      <h3 className="mt-8 mb-4 text-2xl font-semibold tracking-tight scroll-m-20">
        Common Sources
      </h3>
      <p className="mb-4 leading-7">
        Data owned by Electronic Dictionary Research and Development Group such
        as KANJIDIC and EDICT are used under the{" Group's"}{" "}
        <CustomLink href="https://www.edrdg.org/edrdg/licence.html">
          license
        </CustomLink>
        .
      </p>
      <p className="mb-4 leading-7">
        Jonathan{" Waller's"} JLPT resources are licensed under{" "}
        <CustomLink href="https://creativecommons.org/licenses/by/4.0/">
          CC BY 4.0
        </CustomLink>
        .
      </p>
    </article>
  );
};
