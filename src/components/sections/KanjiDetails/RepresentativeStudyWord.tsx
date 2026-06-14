import { useKanjiRepresentativeWord } from "@/providers/kanji-representative-word-provider";
import { ExampleWordPopover } from "@/components/common/ExampleWordPopover";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { GenericPopover } from "@/components/common/GenericPopover";
import { FreqTagBadges } from "@/components/common/FreqTagBadges";
import { JishoBtn } from "@/components/common/JishoBtn";
import { JotobaBtn } from "@/components/common/JotobaBtn";
import { SpeakButton } from "@/components/common/SpeakButton";
import { vocabExternalLinksCore } from "@/lib/external-links";

import { DotIcon, PlusCircle } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useCrossfade } from "@/hooks/use-crossfade";
import { CopyButton } from "@/components/common/CopyButton";


const MarkAsKnownBadge = ({ word }: { word: string }) => {
  const [data, setItem] = useLocalStorage(`known:${word}`, { known: false });
  const toggle = () => setItem("known", !data.known);

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center px-3 text-xs border font-bold rounded-full hover:bg-muted-foreground/5 ${data.known ? "text-green-500 border-green-500" : "text-muted-foreground border-dashed"}`}
    >
      {data.known ? "✓ Known" : "Unmarked"}
    </button>
  );
};

const MemorizeThisWord = () => (
  <GenericPopover
    trigger={
      <button className={`flex gap-2 px-2 py-2 text-sm font-bold underline rounded-lg decoration-dotted underline-offset-8 hover:text-green-400 text-green-500 hover:decoration-solid`}>
        <PlusCircle size={16} className="translate-y-1" /> Memorize this word
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
      <button className="flex p-1 tracking-widest underline uppercase text-muted-foreground decoration-dotted underline-offset-8">
        View Vocabulary Details
      </button>
    }
    content={
      <div className="p-3 text-sm">Coming soon!</div>
    }
  />
);

export const RepresentativeStudyWord = ({ kanji }: { kanji: string }) => {
  const { displayed, opacity } = useCrossfade(kanji);
  const data = useKanjiRepresentativeWord(displayed);

  if (!data) {
    return (
      <div className="w-full p-4 text-sm text-center text-muted-foreground">
        No representative word available for {displayed}.
      </div>
    );
  }

  const { word, reading, englishGloss, tags } = data;

  return (
    <div style={{ opacity, transition: "opacity 180ms ease" }} className="px-2 py-3 space-y-3">
      <div className="flex justify-between gap-1">
        <MemorizeThisWord />
        <MarkAsKnownBadge word={word} key={word} />
      </div>

      <div className="flex flex-col gap-3 pt-6">


        <div>
          <ExampleWordPopover word={word} wordTranslationOverride={englishGloss} className="text-[100px]/[1] p-8" />
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="text-base font-bold">{englishGloss}</span>
          {tags.length > 0 && (
            <FreqTagBadges tags={tags} />
          )}
        </div>


        <div className="flex items-center justify-center gap-1">
          <RomajiBadge kana={reading} />
          <DotIcon className="w-3 p-0 m-0" />
          <JishoBtn word={word} />
          <JotobaBtn word={word} />
          <SpeakButton word={word} iconType="volume-2" />
          <SpeakButton word={reading} iconType="audio-lines" />
          <CopyButton textToCopy={word} iconType="copy" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1 mt-4">
          <ViewVocabDetails />
        </div>


        <div className="mt-6 text-xs">↓ ↓  Explore {word} in the wild ↓ ↓ </div>
        <div className="flex flex-wrap items-center justify-center gap-1">
          {vocabExternalLinksCore.map(({ name, url }) => (
            <a
              key={name}
              href={url(word)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md border border-dotted px-2 py-0.5 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {name}
            </a>
          ))}
        </div>
      </div>
      <p className="pt-24 text-sm text-left">

        <strong>What is a (Representative) Study Word?</strong>
        <br />
        It is a Japanese word algorithmically selected by the Kanji
        Heatmap team to help remember this specific kanji. Each word is unique for each of the
        ~2000 kanji available in Kanji Heatmap.
      </p>
    </div>
  );
};
