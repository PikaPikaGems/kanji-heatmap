import { useKanjiRepresentativeWord } from "@/providers/kanji-representative-word-hooks";
import { isAccountUiHidden } from "@/lib/engine/account-ui";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { BookmarkButton } from "./BookmarkButton";
import { ReviewPileButton } from "./ReviewPileButton";

export const KanjiWordStatusActions = ({ kanji }: { kanji: string }) => {
  const data = useKanjiRepresentativeWord(kanji);
  const status = useAccountStatus();

  // Bookmarks and the review pile live in the account; builds without the
  // study engine have neither.
  if (!data || isAccountUiHidden(status)) {
    return <></>;
  }
  return (
    <div className="flex items-start justify-between gap-2">
      <ReviewPileButton kanji={kanji} word={data.word} />
      <BookmarkButton kanji={kanji} />
    </div>
  );
};
