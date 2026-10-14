import type { ReactNode } from "react";

/** A short message above the note: banners, read-only reasons, draft offers. */
export const StudyNoteNotice = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 text-xs text-left border rounded-lg border-border bg-muted/50">
    {children}
  </div>
);
