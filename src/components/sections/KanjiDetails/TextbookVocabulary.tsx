import { useJsonFetch } from "@/hooks/use-json";
import { TEXT_BOOK_VOCAB_PATH } from "@/lib/assets-paths";
import { PrimaryDataSources } from "@/components/common/PrimaryDataSources";
import { textbookVocabSourceLinks } from "@/lib/external-links";
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
      <PrimaryDataSources links={textbookVocabSourceLinks} />
    </div>
  );
};
