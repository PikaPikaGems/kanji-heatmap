import type { ReactNode } from "react";
import { ErrorToolbarCta, Wrapper } from "./common";
import { Sumimasen } from "./Sumimasen";

/**
 * The すみません 🙇 page: a title, anything under it, and the say hi / report
 * / refresh row with the social icons (unless `showCta` is false).
 */
export const ApologyCard = ({
  title,
  children,
  showCta = true,
}: {
  title: string;
  children?: ReactNode;
  showCta?: boolean;
}) => (
  <Wrapper>
    <div className="flex flex-col items-center w-full max-w-sm gap-5 animate-fade-in">
      <Sumimasen />
      <p className="text-base font-semibold tracking-tight">{title}</p>
      {children}
      {showCta && <ErrorToolbarCta />}
    </div>
  </Wrapper>
);
