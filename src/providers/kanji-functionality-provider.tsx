import { ReactNode } from "react";

import { KanjiWorkerProvider } from "@/kanji-worker/kanji-worker-provider";
import { DefaultErrorFallback } from "@/components/error";

import { SearchSettingsProvider } from "./search-settings-provider";
import { ItemSettingsProvider } from "./item-settings-provider";
import { KanjiReadingCategoryProvider } from "./kanji-reading-category-provider";
import { KanjiStructureProvider } from "./kanji-structure-provider";
import { MultiKanjiStructureProvider } from "./multiple-kanji-structure-provider";

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
          <KanjiStructureProvider>
            <MultiKanjiStructureProvider>
              <ItemSettingsProvider>{children}</ItemSettingsProvider>
            </MultiKanjiStructureProvider>
          </KanjiStructureProvider>
        </KanjiReadingCategoryProvider>
      </KanjiWorkerProvider>
    </SearchSettingsProvider>
  );
};
