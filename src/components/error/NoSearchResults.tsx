import { ErrorSocialIcons, Wrapper } from "./common";
import { Sumimasen } from "./Sumimasen";
import { ClearFiltersCTA } from "../dependent/routing/ClearFiltersCTA";

export const NonIdealResultText = () => {
  return (
    <div className="flex flex-col items-center gap-4 px-2">
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        Kanji Heatmap focuses on kanji used in everyday language and excludes
        those primarily used in proper nouns. As a result, some characters will
        be missing.
      </p>
      <ErrorSocialIcons />
    </div>
  );
};

export const NoSearchResults = () => {
  return (
    <Wrapper>
      <div className="my-6 flex w-full max-w-md flex-col items-center gap-5 animate-fade-in">
        <Sumimasen />
        <div className="space-y-1 font-bold">
          <p>No Kanji match your search.</p>
          <ClearFiltersCTA />
        </div>
        <NonIdealResultText />
      </div>
    </Wrapper>
  );
};
