import { ErrorToolbarCta, Wrapper } from "./common";
import { Sumimasen } from "./Sumimasen";

/**
 * Pages this build doesn't include (the study pages in builds without the
 * engine): the same look as Page Not Found.
 */
export const PageNotAvailable = () => {
  return (
    <Wrapper>
      <div className="flex w-full max-w-sm flex-col items-center gap-5 animate-fade-in">
        <Sumimasen />
        <p className="text-base font-semibold tracking-tight">Not Available</p>
        <ErrorToolbarCta />
      </div>
    </Wrapper>
  );
};
