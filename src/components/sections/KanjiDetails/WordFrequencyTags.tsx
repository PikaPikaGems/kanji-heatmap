import { WordTagBadges } from "@/components/sections/KanjiDetails/WordTagBadges";
import { toTagsWordEntry } from "@/lib/kanji/anchor-words";
import { useWordTags } from "@/providers/kanji-representative-word-hooks";

/**
 * A word's tags and tier from word_frequency_tags.json (anchor and sample
 * words), for a word popover. Nothing for a word the file doesn't have.
 * Asked for when the popover opens.
 */
export const WordFrequencyTags = ({ word }: { word: string }) => {
  const found = useWordTags(word);
  if (found == null) return null;
  return (
    <div className="pb-2 animate-fade-in-fast">
      <WordTagBadges
        entry={toTagsWordEntry(word, found.tags, found.tier)}
        isName={found.tags.includes("name")}
        maxVisible={3}
        className="justify-center"
      />
    </div>
  );
};
