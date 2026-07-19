import { useJsonFetch } from "@/hooks/use-json";
import { SAMPLE_VOCAB_PATH } from "@/lib/assets-paths";
import { PrimaryDataSources } from "@/components/common/PrimaryDataSources";
import { CommonWordEntry } from "@/lib/sample-vocabulary";
import { PaginatedVocabulary } from "./PaginatedVocabulary";
import { TableSkeleton } from "./TableSkeleton";

export const SampleVocabulary = ({ kanji }: { kanji: string }) => {
  const url = `${SAMPLE_VOCAB_PATH}/${kanji}.json`;
  const { data, status, error } = useJsonFetch<CommonWordEntry[]>(url);

  if (status === "pending" || status === "idle") {
    return <TableSkeleton />;
  }

  if (status === "error" || error || !data || data.length === 0) {
    return (
      <div className="w-full p-4 text-base text-center">{`There are no entries for ${kanji} right now.`}</div>
    );
  }

  return (
    <div>
      <PaginatedVocabulary
        data={data}
        shortcuts={{
          prev: { key: "a", shiftKey: true, label: "Shift + A" },
          next: { key: "d", shiftKey: true, label: "Shift + D" },
        }}
      />
      <PrimaryDataSources
        links={[
          {
            text: "JP Word Ranks Lookup",
            url: "https://pikapikagems.github.io/japanese-word-ranks/about/",
          },
        ]}
      />
    </div>
  );
};
