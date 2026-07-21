import { Wrapper } from "./common";
import { NonIdealResultText } from "./NoSearchResults";
import { Sumimasen } from "./Sumimasen";

export const KanjiNotFound = ({ kanji }: { kanji: string }) => {
  return (
    <Wrapper>
      <div className="flex w-full max-w-md flex-col items-center gap-5 px-2 animate-fade-in">
        <Sumimasen />
        <p className="font-bold">{`"${kanji}" Not Found`}</p>
        <NonIdealResultText />
      </div>
    </Wrapper>
  );
};
