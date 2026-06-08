import { ReactNode } from "react";

export const KanjiCardLayout = ({
  main,
  firstWord,
  secondWord,
  badges,
  componentBreakdown
}: {
  main: ReactNode;
  firstWord: ReactNode;
  secondWord: ReactNode;
  badges?: ReactNode;
  componentBreakdown: ReactNode
}) => {
  const hasWords = firstWord && secondWord;
  return (
    <article className="w-full border-2 border-dotted rounded-lg animate-fade-in">

      <div className="relative flex flex-col">
        <div className="my-2">{main}</div>
        {firstWord && (
          <div className="flex flex-col justify-center w-full py-2 mt-2 border-t-2 border-dotted">
            {firstWord}
            {hasWords && (
              <div className="w-full mt-2 mb-2 border-b-2 border-dotted" />
            )}
            {secondWord}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center px-2 py-3 space-x-1 space-y-1 border-t-2 border-dotted">
        {componentBreakdown}
      </div>
      {badges && (
        <div className="flex flex-wrap justify-center px-2 py-3 space-x-1 space-y-1 border-t-2 border-dotted">
          {badges}
        </div>
      )}
    </article>
  );
};
