import { ReactNode } from "react";
import { BottomBar } from "./BottomBar";

/** Standard page container (Dashboard, Mastery): centered column with the
 * dotted BottomBar footer. */
export const ScreenShell = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col w-full max-w-4xl gap-6 px-1 py-5 mx-auto sm:gap-8 sm:px-3 sm:py-8">
    {children}
    <div className="pt-4 mt-4 border-t-2 border-dotted">
      <BottomBar justify="center" />
    </div>
  </div>
);
