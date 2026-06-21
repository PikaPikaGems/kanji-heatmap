import { useEffect, useMemo, useState } from "react";
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

export type KeyShortcut = { key: string; shiftKey?: boolean; label: string };

export type PaginationShortcuts = { prev: KeyShortcut; next: KeyShortcut };

export const useKeyboardPagination = (
  shortcuts: PaginationShortcuts | undefined,
  onPrev: () => void,
  onNext: () => void,
  page: number,
  totalPages: number,
) => {
  useEffect(() => {
    if (!shortcuts) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const { prev, next } = shortcuts;
      const code = e.code;
      const matchesPrev = code === `Key${prev.key.toUpperCase()}` && !!e.shiftKey === !!prev.shiftKey;
      const matchesNext = code === `Key${next.key.toUpperCase()}` && !!e.shiftKey === !!next.shiftKey;
      if (matchesPrev && page > 1) { e.preventDefault(); onPrev(); }
      if (matchesNext && page < totalPages) { e.preventDefault(); onNext(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts, onPrev, onNext, page, totalPages]);
};

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
