import { ReachOutToUs, Wrapper } from "./common";
import { Sumimasen } from "./Sumimasen";
import { ClearFiltersCTA } from "../dependent/routing/ClearFiltersCTA";

export const NonIdealResultText = () => {
  return (
    <>
      <div className="p-4 text-base">
        Kanji Heatmap focuses on kanji used in everyday language and excludes
        those primarily used in proper nouns. As a result, some characters will
        be missing.
      </div>
      <div className="flex flex-wrap items-center justify-center mx-4 text-base">
        <ReachOutToUs prefix={`Is this a mistake? Let us know on `} />
      </div>
    </>
  );
};

export const NoSearchResults = () => {
  return (
    <Wrapper>
      <div className="my-6 animate-fade-in">
        <Sumimasen />
        <div className="my-2 font-bold">
          <span>No Kanji match your search.</span>
          <br />
          <ClearFiltersCTA />
        </div>

        <NonIdealResultText />
      </div>
    </Wrapper>
  );
};
