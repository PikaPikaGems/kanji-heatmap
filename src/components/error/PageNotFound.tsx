import { ErrorToolbarCta, Wrapper } from "./common";
import { Sumimasen } from "./Sumimasen";

export const PageNotFound = () => {
  return (
    <Wrapper>
      <div className="flex w-full max-w-sm flex-col items-center gap-5 animate-fade-in">
        <Sumimasen />
        <p className="text-base font-semibold tracking-tight">Page Not Found</p>
        <ErrorToolbarCta />
      </div>
    </Wrapper>
  );
};
