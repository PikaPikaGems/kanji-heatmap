import type { ReactNode } from "react";
import { Pagination } from "@/components/sections/KanjiDetails/Pagination";

/**
 * One page of an operations list with the "← 1 of 4 →" pagination both
 * above and below it, so the next page is in reach without scrolling. The
 * page fades in when it changes.
 */
export const PagedOperations = ({
  page,
  totalPages,
  onPageChange,
  children,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  children: ReactNode;
}) => {
  const pager = (className: string) =>
    totalPages > 1 && (
      <Pagination
        className={className}
        page={page}
        totalPages={totalPages}
        onPrev={() => onPageChange(page - 1)}
        onNext={() => onPageChange(page + 1)}
      />
    );

  return (
    <div className="flex flex-col">
      {pager("mt-0 mb-3")}
      <div key={page} className="animate-fade-in-fast">
        {children}
      </div>
      {pager("mt-3")}
    </div>
  );
};
