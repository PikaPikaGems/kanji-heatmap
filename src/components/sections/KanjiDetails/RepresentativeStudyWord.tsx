import { useKanjiRepresentativeWord } from "@/providers/kanji-representative-word-provider";
import { ExampleWordPopover } from "@/components/common/ExampleWordPopover";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { GenericPopover } from "@/components/common/GenericPopover";
import { FreqTagBadges } from "@/components/common/FreqTagBadges";
import { vocabExternalLinksCore } from "@/lib/external-links";

import { DotIcon, InfoIcon, PlusCircle } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";

import { VocabActions } from "@/components/common/VocabActions";


const MarkAsKnownBadge = ({ word }: { word: string }) => {
  const [data, setItem] = useLocalStorage(`known:${word}`, { known: false });
  const toggle = () => setItem("known", !data.known);

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 px-2 py-1 my-1 text-xs font-semibold rounded-full transition-colors whitespace-nowrap ${data.known
        ? "bg-green-500/15 text-green-500 border border-green-500"
        : "border border-dashed border-foreground/50 text-muted-foreground hover:text-foreground"
        }`}
    >
      {data.known ? "✓ Known" : "Unmarked"}
    </button>
  );
};

const MemorizeThisWord = ({ word }: { word: string }) => (
  <GenericPopover
    trigger={
      <button className={`flex text-left gap-2 px-2 py-2 text-sm font-bold underline rounded-lg decoration-dotted underline-offset-4 hover:text-green-400 text-green-500 hover:decoration-solid`}>
        <PlusCircle size={16} className="translate-y-0.5" /> Add {word} to my review pile
      </button>
    }
    content={
      <div className="p-3 text-sm">Coming soon!</div>
    }
  />
);

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

export const RepresentativeStudyWord = ({ kanji }: { kanji: string }) => {
  const data = useKanjiRepresentativeWord(kanji);

  if (!data) {
    return (
      <div className="w-full p-4 text-base text-center">
        No (representative) study word available for {kanji}.
      </div>
    );
  }

  const { word, reading, englishGloss, tags } = data;

  return (
    <div className="py-3 space-y-3 ">
      <div className="flex items-start justify-between">
        <MemorizeThisWord word={word} />
        <MarkAsKnownBadge word={word} key={word} />
      </div>

      <div className="flex flex-col gap-3 pt-6">


        <div className="overflow-auto">
          <ExampleWordPopover word={word} wordTranslationOverride={englishGloss} className="text-7xl sm:text-[100px]/[1] p-8" />
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
        <GenericPopover
          trigger={
            <span className="inline-flex items-center gap-1 leading-loose underline cursor-pointer decoration-dotted underline-offset-8">
              <strong>What is a Study Word? (Experimental Feature)</strong><InfoIcon size={14} />
            </span>
          }

          content={
            <div className="p-4 text-xs w-96">
              A Study Word is a Japanese word chosen by {`Kanji Heatmap Data's`} selection algorithm to help reinforce a specific kanji through vocabulary. Each of the ~2,000 kanji in Kanji Heatmap has a unique Study Word.
              The selection algorithm is still being refined, so Study Words may change over time as the feature improves.
            </div>
          }
        />
      </div>
    </div>
  );
};
