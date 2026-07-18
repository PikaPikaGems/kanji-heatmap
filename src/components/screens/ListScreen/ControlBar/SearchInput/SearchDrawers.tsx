import { lazy, Suspense } from "react";
import { SearchType } from "@/lib/settings/settings";
import { DialogType } from "@/lib/search-input-logic";
import { RadicalsLoadingFallback } from "./RadicalScreen/RadicalsLoadingFallback";
import { HandwritingLoadingFallback } from "./HandwritingScreen/HandwritingLoadingFallback";

const RadicalsControl = lazy(() =>
  import("./RadicalScreen/RadicalsControl").then((m) => ({
    default: m.RadicalsControl,
  }))
);
const HandwritingControl = lazy(() =>
  import("./HandwritingScreen/HandwritingControl").then((m) => ({
    default: m.HandwritingControl,
  }))
);

/**
 * The lazily-loaded radical and handwriting drawers attached to the search
 * input. Handwriting stays mounted while its search type is active (even
 * with the drawer closed) so drawn strokes survive close/reopen.
 */
export const SearchDrawers = ({
  searchType,
  openDialogType,
  onClose,
  value,
  onChange,
  handwritingResetKey,
}: {
  searchType: SearchType;
  openDialogType: DialogType | "none";
  onClose: () => void;
  value: string;
  onChange: (newStr: string, type: SearchType) => void;
  handwritingResetKey: number;
}) => {
  return (
    <>
      {(openDialogType === "radicals" || searchType === "radicals") && (
        <Suspense
          fallback={
            <RadicalsLoadingFallback
              isOpen={openDialogType === "radicals"}
              onClose={onClose}
            />
          }
        >
          <RadicalsControl
            isOpen={openDialogType === "radicals"}
            onClose={onClose}
            value={value}
            onChange={(newStr) => onChange(newStr, "radicals")}
          />
        </Suspense>
      )}

      {(searchType === "handwriting" ||
        searchType === "handwriting-alt" ||
        searchType === "handwriting-alt-2") && (
        // Keyed by search type + reset counter so switching variants or clearing
        // the input starts the drawing pad fresh. Mounted regardless of the
        // drawer's open state so the drawing survives closing/reopening it.
        <Suspense
          fallback={
            <HandwritingLoadingFallback
              isOpen={openDialogType === searchType}
              onClose={onClose}
            />
          }
        >
          <HandwritingControl
            key={`${searchType}-${handwritingResetKey}`}
            variant={
              searchType === "handwriting"
                ? "google"
                : searchType === "handwriting-alt"
                  ? "kanjicanvas"
                  : "dakanji"
            }
            isOpen={openDialogType === searchType}
            onClose={onClose}
            value={value}
            onChange={(newStr) => onChange(newStr, searchType)}
          />
        </Suspense>
      )}
    </>
  );
};
