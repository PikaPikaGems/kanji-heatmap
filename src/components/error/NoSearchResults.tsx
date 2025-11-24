import { ReachOutToUs, Wrapper } from "./common";
import { Sumimasen } from "./Sumimasen";
import { ClearFiltersCTA } from "../dependent/routing/ClearFiltersCTA";

export const NonIdealResultText = () => {
  return (
    <>
      <div className="text-xs">
        Since Kanji Heatmap focuses on the most common kanji, some characters
        might be missing.
      </div>
      <div className="text-xs flex items-center flex-wrap mx-4 justify-center">
        <ReachOutToUs prefix={`Is this a mistake? Let us know on `} />
      </div>
    </>
  );
};

export const NoSearchResults = () => {
  return (
    <Wrapper>
      <Sumimasen />
      <div className="my-2 font-bold">
        <span>No Kanji match your search.</span>
        <br />
        <ClearFiltersCTA />
      </div>

      <NonIdealResultText />
    </Wrapper>
  );
};
