import { Wrapper } from "./common";
import { NonIdealResultText } from "./NoSearchResults";
import { Sumimasen } from "./Sumimasen";

export const KanjiNotFound = ({ kanji }: { kanji: string }) => {
  return (
    <Wrapper>
      <div className="px-4">
        <Sumimasen />
        <div className="my-2 font-bold">{`"${kanji}" Not Found`}</div>
        <NonIdealResultText />
      </div>
    </Wrapper>
  );
};
