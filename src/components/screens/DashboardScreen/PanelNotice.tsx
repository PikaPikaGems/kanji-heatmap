import { ReactNode } from "react";

/** A framed message for a dashboard panel body: the same dashed box as an empty state. */
export const PanelNotice = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col items-center gap-3 px-4 py-6 text-sm text-center border-2 border-dashed rounded-2xl border-foreground/20 bg-muted/20 text-muted-foreground">
    {children}
  </div>
);
