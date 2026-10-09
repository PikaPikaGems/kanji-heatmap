import { ErrorBoundary } from "@/components/error";
import { SmallUnexpectedErrorFallback } from "@/components/error/SmallUnexpectedErrorFallback";
import { SearchDrawerShell } from "@/components/common/BottomSheet";
import {
  RadicalScreenLayout,
  RadicalsResultsPreview,
  RadicalsSelected,
} from "../RadicalScreen/RadicalScreen";
import { ComponentScreenContent } from "./ComponentScreen";

// Like RadicalsControl: the selection is the search text, one character per
// component, and every change is reported back through `onChange`.
export const ComponentsControl = ({
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
    <SearchDrawerShell
      isOpen={isOpen}
      onClose={onClose}
      title="Component Search"
      description="Search by Component"
    >
      <ErrorBoundary fallback={<SmallUnexpectedErrorFallback />}>
        <RadicalScreenLayout
          noun="Components"
          count={[...value].length}
          top={
            <ErrorBoundary>
              <ComponentScreenContent
                value={new Set([...value])}
                setValue={(components) => onChange([...components].join(""))}
              />
            </ErrorBoundary>
          }
          middle={
            <ErrorBoundary fallback={<SmallUnexpectedErrorFallback />}>
              <RadicalsSelected
                value={[...value]}
                // Most components have no keyword; show just the glyph.
                missingKeyword={null}
                onClick={(component) => {
                  const components = new Set([...value]);
                  components.delete(component);
                  onChange([...components].join(""));
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
    </SearchDrawerShell>
  );
};
