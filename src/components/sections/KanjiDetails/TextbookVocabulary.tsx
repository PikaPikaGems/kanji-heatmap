import { useJsonFetch } from "@/hooks/use-json";
import { TEXT_BOOK_VOCAB_PATH } from "@/lib/assets-paths";
import { PrimaryDataSources } from "@/components/common/PrimaryDataSources";
import {
  TextbookWordEntry,
  toCommonWordEntries,
} from "@/lib/sample-vocabulary";
import { PaginatedVocabulary } from "./PaginatedVocabulary";
import { TableSkeleton } from "./TableSkeleton";

export const TextbookVocabulary = ({ kanji }: { kanji: string }) => {
  const url = `${TEXT_BOOK_VOCAB_PATH}/${kanji}.json`;
  const { data, status, error } =
    useJsonFetch<Record<string, TextbookWordEntry>>(url);

  if (status === "pending" || status === "idle") {
    return <TableSkeleton />;
  }

  if (
    status === "error" ||
    error ||
    !data ||
    Object.keys(data?.[kanji] ?? {}).length === 0
  ) {
    return (
      <div className="w-full p-4 text-base text-center">{`There are no entries for ${kanji} right now.`}</div>
    );
  }

  const commonWordData = toCommonWordEntries(data[kanji]);

  return (
    <div>
      <PaginatedVocabulary
        data={commonWordData}
        shortcuts={{
          prev: { key: "a", label: "a" },
          next: { key: "d", label: "d" },
        }}
      />
      <PrimaryDataSources
        links={[
          {
            text: "Anki Deck: 1564742924",
            url: "https://ankiweb.net/shared/info/1564742924",
          },
          {
            text: "Anki Deck: 779483253",
            url: "https://ankiweb.net/shared/info/779483253",
          },
          {
            text: "Anki Deck: 2106223612",
            url: "https://ankiweb.net/shared/info/2106223612",
          },
          {
            text: "Anki Deck: 1468618470",
            url: "https://ankiweb.net/shared/info/1468618470",
          },
          {
            text: "Kanji Mastery Blog",
            url: "https://kanjimastery.blogspot.com/",
          },
        ]}
      />
    </div>
  );
};
