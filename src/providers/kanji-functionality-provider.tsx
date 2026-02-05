import { ReactNode } from "react";

import { KanjiWorkerProvider } from "@/kanji-worker/kanji-worker-provider";
import { DefaultErrorFallback } from "@/components/error";

import { SearchSettingsProvider } from "./search-settings-provider";
import { ItemSettingsProvider } from "./item-settings-provider";
import { KanjiReadingCategoryProvider } from "./kanji-reading-category-provider";
import { VocabDataProvider } from "./vocab-data-provider";

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
            <DefaultErrorFallback message="Well, this is embarrasing. Something went wrong." />
          </div>
        }
      >
        <KanjiReadingCategoryProvider>
          <VocabDataProvider>
            <ItemSettingsProvider>{children}</ItemSettingsProvider>
          </VocabDataProvider>
        </KanjiReadingCategoryProvider>
      </KanjiWorkerProvider>
    </SearchSettingsProvider>
  );
};
