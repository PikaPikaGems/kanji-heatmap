import { ErrorBoundary } from "@/components/error";
import { SmallUnexpectedErrorFallback } from "@/components/error/SmallUnexpectedErrorFallback";
import {
  RadicalScreenContent,
  RadicalScreenLayout,
  RadicalsResultsPreview,
  RadicalsSelected,
} from "./RadicalScreen";
import { RadicalsScreenDialog } from "./RadicalScreenDialog";

// The selected radicals are derived from `value` (the search text); selecting or
// removing a radical reports the new string back through `onChange`.
export const RadicalsControl = ({
  isOpen,
  onClose,
  value,
  onChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (newValue: string) => void;
}) => {
  return (
    <RadicalsScreenDialog isOpen={isOpen} onClose={onClose}>
      <ErrorBoundary fallback={<SmallUnexpectedErrorFallback />}>
        <RadicalScreenLayout
          count={[...value].length}
          top={
            <ErrorBoundary>
              <RadicalScreenContent
                value={new Set([...value])}
                setValue={(radicals) => onChange([...radicals].join(""))}
              />
            </ErrorBoundary>
          }
          middle={
            <ErrorBoundary fallback={<SmallUnexpectedErrorFallback />}>
              <RadicalsSelected
                value={[...value]}
                onClick={(radical) => {
                  const radicals = new Set([...value]);
                  radicals.delete(radical);
                  onChange([...radicals].join(""));
                }}
              />
            </ErrorBoundary>
          }
          bottom={
            <ErrorBoundary fallback={<SmallUnexpectedErrorFallback />}>
              <RadicalsResultsPreview onClick={onClose} />
            </ErrorBoundary>
          }
        />
      </ErrorBoundary>
    </RadicalsScreenDialog>
  );
};
