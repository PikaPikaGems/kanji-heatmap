import { ReactNode } from "react";
import { LinksOutItems } from "@/components/common/LinksOutItems";
import { cnTextLink } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

export const RefreshOrGoBackHome = () => {
  return (
    <p className="text-xs text-muted-foreground">
      Meanwhile, you can try{" "}
      <button
        type="button"
        className={cnTextLink}
        onClick={() => {
          window?.location.reload();
        }}
      >
        refreshing the page
      </button>{" "}
      or try again later.
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
