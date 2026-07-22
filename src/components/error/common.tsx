import { ReactNode } from "react";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { LinksOutItems } from "@/components/common/LinksOutItems";
import { cnTextLink } from "@/lib/generic-cn";
import { outLinks } from "@/lib/external-links";
import { cn } from "@/lib/utils";

/** Linked CTA: Discord / GitHub issue / reload — shown above the icon row. */
export const SayHiReportOrRefresh = () => {
  return (
    <p className="text-xs text-muted-foreground">
      Say{" "}
      <ExternalTextLink
        href={outLinks.discord}
        text="hi"
        className="px-0.5 py-0"
      />
      , report a{" "}
      <ExternalTextLink
        href={outLinks.githubIssue}
        text="bug"
        className="px-0.5 py-0"
      />
      , or{" "}
      <button
        type="button"
        className={`${cnTextLink} px-0.5 py-0`}
        onClick={() => {
          window?.location.reload();
        }}
      >
        refresh
      </button>
      .
    </p>
  );
};

export const Wrapper = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center px-4 py-8 text-center",
        className
      )}
    >
      {children}
    </div>
  );
};

/** Same social/out-link icons used in the header and bottom bar. */
export const ErrorSocialIcons = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-1",
        className
      )}
    >
      <LinksOutItems />
    </div>
  );
};

/** Text CTA above icons (toolbar layout). */
export const ErrorToolbarCta = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex w-full flex-col items-center gap-3", className)}>
      <SayHiReportOrRefresh />
      <ErrorSocialIcons />
    </div>
  );
};
