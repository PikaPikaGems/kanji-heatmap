import { ReactNode } from "react";

export const KanjiCardLayout = ({
  main,
  firstWord,
  secondWord,
  components,
  badges,
}: {
  main: ReactNode;
  firstWord: ReactNode;
  secondWord: ReactNode;
  components?: ReactNode;
  badges?: ReactNode;
}) => {
  const hasWords = firstWord && secondWord;
  return (
    <article className="w-full border-2 border-dotted rounded-lg animate-fade-in">

      <div className="hidden sm:flex">
        <div className="border-r-2 border-dotted">{main}</div>
        {firstWord && (
          <div className="w-full px-2 pt-4 pb-4">
            {firstWord}
            {hasWords && (
              <div className="w-full mt-6 mb-2 border-b-2 border-dotted" />
            )}
            {secondWord}
          </div>
        )}
      </div>

      <div className="relative flex flex-col sm:hidden">
        <div>{main}</div>
        {firstWord && (
          <div className="flex flex-col justify-center w-full px-2 py-2 mt-2 border-t-2 border-dotted">
            {firstWord}
            {hasWords && (
              <div className="w-full mt-2 mb-2 border-b-2 border-dotted" />
            )}
            {secondWord}
          </div>
        )}
      </div>
      {components && (
        <>
          <div className="flex flex-wrap justify-center w-full pt-1 mr-4 border-t-2 border-dotted">
            {components}
          </div>
        </>
      )}
      {badges && (
        <div className="flex flex-wrap justify-center px-2 pt-1 mt-1 mb-2 space-x-1 space-y-1 border-t-2 border-dotted">
          <div />
          {badges}
        </div>
      )}
    </article>
  );
};
