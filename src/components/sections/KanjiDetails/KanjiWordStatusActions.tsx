import { useKanjiRepresentativeWord } from "@/providers/kanji-representative-word-hooks";
import { GenericPopover } from "@/components/common/GenericPopover";
import { PlusCircle } from "lucide-react";
import { isAccountUiHidden } from "@/lib/engine/account-ui";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { BookmarkButton } from "./BookmarkButton";

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
  const status = useAccountStatus();

  // Bookmarks and the review pile live in the account; builds without the
  // study engine have neither.
  if (!data || isAccountUiHidden(status)) {
    return <></>;
  }
  return (
    <div className="flex items-start justify-between">
      <MemorizeThisWord word={data.word} />
      <BookmarkButton kanji={kanji} />
    </div>
  );
};
