import { ReactNode } from "react";
import { CircleX } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { SHEET_CLOSE_BTN_CN } from "@/components/common/BottomSheet";

export const SearchDialogLoadingShell = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) => {
  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-50 bg-black/80"
        onClick={onClose}
        aria-label={`Close ${title}`}
      />
      <section
        className="fixed inset-x-0 bottom-0 z-50 max-h-[100dvh] overflow-hidden rounded-t-3xl border-2 border-t-4 border-dashed bg-background px-2 pb-3 pt-5 shadow-lg animate-in slide-in-from-bottom-4 duration-200"
        role="status"
        aria-label={`Loading ${title}`}
      >
        <h2 className="sr-only">{title}</h2>
        {children}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`absolute top-2 right-2 z-[51] ${SHEET_CLOSE_BTN_CN}`}
          onClick={onClose}
          aria-label={`Close ${title}`}
        >
          <CircleX className="size-8" />
        </Button>
      </section>
    </>
  );
};
