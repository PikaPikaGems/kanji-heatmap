import { useKanjiRepresentativeWord } from "@/providers/kanji-representative-word-provider";
import { GenericPopover } from "@/components/common/GenericPopover";
import { PlusCircle } from "lucide-react";
import { useLocalStorageFlag } from "@/hooks/use-local-storage";
import { bookmarkStorageKey } from "@/lib/bookmarks";

const MarkAsKnownBadge = ({ kanji, word }: { kanji: string; word: string }) => {
  const [isKnown, setIsKnown] = useLocalStorageFlag(
    bookmarkStorageKey(kanji, word)
  );
  const toggle = () => setIsKnown(!isKnown);

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 px-2 py-1 my-1 text-xs font-semibold rounded-full transition-colors whitespace-nowrap ${
        isKnown
          ? "bg-green-500/15 text-green-500 border border-green-500"
          : "border border-dashed border-foreground/50 text-muted-foreground hover:text-foreground"
      }`}
    >
      {isKnown ? "✓ Bookmarked" : "Bookmark"}
    </button>
  );
};

const MemorizeThisWord = ({ word }: { word: string }) => (
  <GenericPopover
    trigger={
      <button
        className={`flex text-left gap-2 px-2 py-2 text-sm font-bold underline rounded-lg decoration-dotted underline-offset-4 hover:text-green-400 text-green-500 hover:decoration-solid`}
      >
        <PlusCircle size={16} className="translate-y-0.5" /> Add {word} to my
        review pile
      </button>
    }
    content={<div className="p-3 text-sm">Coming soon!</div>}
  />
);

export const KanjiWordStatusActions = ({ kanji }: { kanji: string }) => {
  const data = useKanjiRepresentativeWord(kanji);

  if (!data) {
    return <></>;
  }
  return (
    <div className="flex items-start justify-between">
      <MemorizeThisWord word={data.word} />
      <MarkAsKnownBadge kanji={kanji} word={data.word} />
    </div>
  );
};
