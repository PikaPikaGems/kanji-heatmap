import { useKanjiRepresentativeWord } from "@/providers/kanji-representative-word-provider";
import { ExampleWordPopover } from "@/components/common/ExampleWordPopover";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { GenericPopover } from "@/components/common/GenericPopover";
import { FreqTagBadges } from "@/components/common/FreqTagBadges";
import { vocabExternalLinksCore } from "@/lib/external-links";
import { DotIcon, InfoIcon } from "lucide-react";

import { VocabActions } from "@/components/common/VocabActions";






const ViewVocabDetails = () => (
  <GenericPopover
    trigger={
      <button className="flex p-1 text-base tracking-widest underline uppercase hover:text-foreground text-muted-foreground decoration-dashed underline-offset-8">
        View Vocabulary Details
      </button>
    }
    content={
      <div className="p-3 text-sm">Coming soon!</div>
    }
  />
);

const WhatIsARepresentativeStudyWord = () => {
  return (
    <>
      <GenericPopover
        trigger={
          <span className="inline-flex items-center gap-1 leading-loose underline cursor-pointer decoration-dotted underline-offset-8">
            <strong>What is a Anchor Word? (Experimental Feature)</strong><InfoIcon size={14} />
          </span>
        }

        content={
          <div className="p-4 text-xs text-left w-96">
            <p className="py-2">
              An <strong>Anchor Word</strong> is a Japanese word chosen to create a strong, memorable connection between a kanji and one of its vocabulary words. Each of the ~2,000 kanji in Kanji Heatmap has one unique Anchor Word.
            </p>
            <p className="py-2">
              Anchor Words are selected by {`Kanji Heatmap's`} algorithm, which is still experimental and being refined. As the algorithm improves, Anchor Words may change over time.
            </p>
          </div>
        }
      /></>
  )
}

export const RepresentativeStudyWord = ({ kanji }: { kanji: string }) => {
  const data = useKanjiRepresentativeWord(kanji);

  if (!data) {
    return (
      <div className="w-full p-4 text-base text-center">
        No Anchor Word available for {kanji}.
      </div>
    );
  }

  const { word, reading, englishGloss, tags } = data;

  return (
    <div className="py-3 space-y-3 ">
      <div className="flex flex-col gap-3 pt-6">
        <div className="overflow-auto">
          <ExampleWordPopover
            word={word}
            wordTranslationOverride={englishGloss}
            readingOverride={reading}
            className="text-7xl sm:text-[100px]/[1] p-8"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-base font-bold">{englishGloss}</span>
          {tags.length > 0 && (
            <FreqTagBadges tags={tags} />
          )}
        </div>


        <div className="flex flex-wrap items-center justify-center gap-1">

          <RomajiBadge kana={reading} />
          <DotIcon className="w-3 p-0 m-0" />
          <VocabActions word={word} kana={reading} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1 mt-4">
          <ViewVocabDetails />
        </div>


        <div className="mt-6 text-sm">👇  Explore <span className="font-bold">{word}</span> in the wild 👇 </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {vocabExternalLinksCore.map(({ name, url }) => (
            <a
              key={name}
              href={url(word)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-3 py-1 text-sm transition-colors border border-dashed rounded-full border-foreground/30 hover:bg-accent hover:text-accent-foreground"
            >
              {name}
            </a>
          ))}
        </div>
      </div>
      <div className="pt-16 pl-2 text-left">
        <WhatIsARepresentativeStudyWord />
      </div>
    </div>
  );
};
