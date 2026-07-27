import { ReactNode } from "react";

import { KanjiWorkerProvider } from "@/kanji-worker/kanji-worker-provider";
import { DefaultErrorFallback } from "@/components/error";

import { SearchSettingsProvider } from "./search-settings-provider";
import { ItemSettingsProvider } from "./item-settings-provider";

export const KanjiFunctionalityProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <SearchSettingsProvider>
      <KanjiWorkerProvider
        fallback={
          <div className="py-20">
            <DefaultErrorFallback message="Well, this is embarrassing. Something went wrong." />
          </div>
        }
      >
        <ItemSettingsProvider>{children}</ItemSettingsProvider>
      </KanjiWorkerProvider>
    </SearchSettingsProvider>
  );
};
