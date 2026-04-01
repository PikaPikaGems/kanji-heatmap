import { ReachOutToUs, Wrapper } from "./common";
import { Sumimasen } from "./Sumimasen";
import { ClearFiltersCTA } from "../dependent/routing/ClearFiltersCTA";

export const NonIdealResultText = () => {
  return (
    <>
      <div className="text-base">
        Since Kanji Heatmap focuses on the most common kanji, some characters
        might be missing.
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
