import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** The rounded card the operations sit in, one row each, dotted between. */
export const OperationList = ({ children }: { children: ReactNode }) => (
  <ul className="overflow-hidden border divide-y divide-dotted divide-foreground/20 rounded-2xl border-foreground/20 bg-muted/15">
    {children}
  </ul>
);

/** The operation type's icon in a small tile at the start of a row. */
export const OperationIcon = ({ Icon }: { Icon: LucideIcon }) => (
  <span
    aria-hidden
    className="flex items-center justify-center border size-9 shrink-0 rounded-xl border-foreground/15 bg-background"
  >
    <Icon className="size-4" />
  </span>
);

/** The kanji an operation is about, at the end of its row. */
export const OperationKanji = ({ kanji }: { kanji: string }) => (
  <span className="text-3xl leading-none kanji-font shrink-0">{kanji}</span>
);

/** An empty tab: a dashed card with a short message. */
export const EmptyOperations = ({
  icon,
  children,
}: {
  icon: string;
  children: string;
}) => (
  <div className="flex flex-col items-center gap-2 px-4 py-8 text-center border-2 border-dashed rounded-2xl border-border">
    <span aria-hidden className="text-3xl">
      {icon}
    </span>
    <p className="text-sm font-semibold text-muted-foreground">{children}</p>
  </div>
);
