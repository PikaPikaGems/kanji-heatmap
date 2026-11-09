import { ReactNode } from "react";

/** A message (and its action) in place of the grid, centered under the header. */
export const MasteryCenteredMessage = ({
  children,
}: {
  children: ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center gap-4 px-6 pt-12 text-center min-h-dvh pb-28 animate-fade-in">
    {children}
  </div>
);
