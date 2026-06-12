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
  return (
    <article className="w-full border-2 border-dotted rounded-lg animate-fade-in">

      <div className="relative flex flex-col">
        <div className="my-2">{main}</div>
        <div>
          {firstWord && (
            <div className="flex flex-wrap justify-center w-full">
              <div className="p-2 m-1 border-2 border-dotted rounded-3xl">
                {firstWord}
              </div>
              {secondWord && <div className="p-2 m-1 border-2 border-dotted rounded-3xl">
                {secondWord}
              </div>}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center px-2 space-x-1 space-y-1">
        {componentBreakdown}
      </div>
      {badges && (
        <div className="flex flex-wrap justify-center w-full px-2 py-3 space-x-1">
          {badges}
        </div>
      )}
    </article>
  );
};
