import { ReactNode } from "react";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";

import { cnTextLink } from "@/lib/generic-cn";
import { outLinks } from "@/lib/external-links";

export const RefreshOrGoBackHome = () => {
  return (
    <>
      Meanwhile, you can try{" "}
      <button
        className={cnTextLink}
        onClick={() => {
          window?.location.reload();
        }}
      >
        refreshing the page
      </button>
      or try again later.
    </>
  );
};

export const Wrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center pt-4">
      {children}
    </div>
  );
};

const SHOW_TWITTER = true;
export const ReachOutToUs = ({
  prefix = " Let us know on ",
}: {
  prefix?: string;
}) => {
  return (
    <>
      {prefix}
      <ExternalTextLink href={outLinks.discord} text="Discord," />
      {SHOW_TWITTER && (
        <ExternalTextLink href={outLinks.twitter} text="Twitter," />
      )}
      <ExternalTextLink href={outLinks.githubIssue} text="GitHub," /> or
      <ExternalTextLink href={outLinks.koFi} text="Ko-Fi." />
    </>
  );
};
