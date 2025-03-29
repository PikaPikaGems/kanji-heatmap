import { ErrorBoundary } from "@/components/error";
import { KanjiCard } from "./KanjiCard";
import { SmallKanjiCard } from "./SmallCard";

export const ResponsiveKanjiCard = ({ kanji }: { kanji: string }) => {
  return (
    <>
      <div className="hidden [@media(min-height:725px)]:[@media(min-width:400px)]:block w-96">
        <ErrorBoundary details="KanjiCard in ResponsiveKanjiCard">
          <KanjiCard kanji={kanji} />
        </ErrorBoundary>
      </div>
      <div className="flex items-center justify-center [@media(min-height:725px)]:[@media(min-width:400px)]:hidden">
        <ErrorBoundary details="SmallKanjiCard in ResponsiveKanjiCard">
          <SmallKanjiCard kanji={kanji} />
        </ErrorBoundary>
      </div>
    </>
  );
};
