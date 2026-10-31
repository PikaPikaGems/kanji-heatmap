import { isAccountUiHidden } from "@/lib/engine/account-ui";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { usePileWords } from "@/lib/engine/use-review-pile-add";
import { BookmarkButton } from "./BookmarkButton";
import { ReviewPileButton } from "./ReviewPileButton";

export const KanjiWordStatusActions = ({ kanji }: { kanji: string }) => {
  const pile = usePileWords(kanji);
  const status = useAccountStatus();

  // Bookmarks and the review pile live in the account; builds without the
  // study engine have neither.
  if (!pile || isAccountUiHidden(status)) {
    return <></>;
  }
  return (
    <div className="flex items-start justify-between gap-2">
      <ReviewPileButton
        kanji={kanji}
        words={pile.words}
        wordsLoaded={pile.loaded}
      />
      <BookmarkButton kanji={kanji} />
    </div>
  );
};
