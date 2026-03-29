import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "@/components/icons";

export const Pagination = ({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) => (
  <div className="flex items-center justify-center gap-3 mt-3 text-sm text-muted-foreground">
    <Button
      size="icon"
      variant="outline"
      className="rounded-lg h-7 w-7"
      disabled={page === 1}
      onClick={onPrev}
    >
      <ArrowLeft />
    </Button>
    <span>
      {page} of {totalPages}
    </span>
    <Button
      size="icon"
      variant="outline"
      className="rounded-lg h-7 w-7"
      disabled={page === totalPages}
      onClick={onNext}
    >
      <ArrowRight />
    </Button>
  </div>
);

export const usePagination = (totalItems: number, itemsPerPage: number = 5) => {
  const [page, setPage] = useState(1);

  const state = useMemo(() => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const start = (page - 1) * itemsPerPage;
    const end = page * itemsPerPage;
    return {
      page,
      setPage,
      totalPages,
      onPrev: () => setPage((p) => p - 1),
      onNext: () => setPage((p) => p + 1),
      start,
      end,
    };
  }, [page, totalItems, itemsPerPage]);

  return state;
};
