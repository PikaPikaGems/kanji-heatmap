import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Keyboard } from "@/components/icons";
import { CommonWordEntry, sortWordData } from "@/lib/sample-vocabulary";
import { Pagination } from "./Pagination";
import {
  usePagination,
  useKeyboardPagination,
  PaginationShortcuts,
} from "./pagination-hooks";
import { WordRow } from "./WordRow";

const ShortcutKey = ({ label }: { label: string }) => (
  <kbd className="inline-flex whitespace-nowrap items-center px-2 py-1 font-mono text-[11px] font-medium lowercase border border-dotted rounded-xl bg-background text-foreground/70">
    {label}
  </kbd>
);

const ShortcutHint = ({ shortcuts }: { shortcuts: PaginationShortcuts }) => (
  <div className="flex justify-center mt-5 mb-1 uppercase">
    <div className="inline-flex overflow-x-auto items-center gap-4 rounded-full  bg-muted/10 px-5 py-2 text-[10px] text-muted-foreground">
      <Keyboard className="w-4 h-4 shrink-0" />
      <span>shortcuts</span>
      <span className="flex items-center gap-2">
        <ShortcutKey label={shortcuts.prev.label} />
        <span>previous</span>
      </span>
      <span className="flex items-center gap-1.5">
        <ShortcutKey label={shortcuts.next.label} />
        <span>next</span>
      </span>
    </div>
  </div>
);

/** Sorted, paginated vocab table shared by the sample and textbook sections. */
export const PaginatedVocabulary = ({
  data,
  shortcuts,
}: {
  data: CommonWordEntry[];
  shortcuts?: PaginationShortcuts;
}) => {
  const sortedData = useMemo(() => {
    return sortWordData(data);
  }, [data]);

  const { start, end, onPrev, onNext, page, totalPages } = usePagination(
    sortedData.length
  );
  const pageData = useMemo(() => {
    const result = sortedData.slice(start, end);
    return result;
  }, [sortedData, end, start]);

  useKeyboardPagination(shortcuts, onPrev, onNext, page, totalPages);

  const pagination = (
    <>
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={onPrev}
          onNext={onNext}
        />
      )}
    </>
  );

  return (
    <div className="px-2 mt-4 -mx-2 overflow-x-auto" key={`${start}-${end}`}>
      <p className="w-full px-4 text-left">
        {data.length} total {data.length === 1 ? "item" : "items"}
      </p>
      {pagination}
      <Table className="w-full min-w-[400px] mt-4 animate-fade-in">
        <TableHeader>
          <TableRow>
            <TableHead className="text-left w-fit">Speak</TableHead>
            <TableHead className="text-center w-fit">Word</TableHead>
            <TableHead className="text-center w-fit">Reading</TableHead>
            <TableHead className="text-center min-w-16 max-w-24">
              Translation
            </TableHead>
            <TableHead className="text-center w-fit">Tags</TableHead>
            <TableHead className="w-24 text-left">Jisho.org</TableHead>
            <TableHead className="w-24 text-left">Jotoba.de</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageData.map((entry) => (
            <WordRow key={entry.w} entry={entry} />
          ))}
        </TableBody>
      </Table>
      {pagination}
      {shortcuts && totalPages > 1 && <ShortcutHint shortcuts={shortcuts} />}
    </div>
  );
};
