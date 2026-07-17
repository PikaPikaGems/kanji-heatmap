import { forwardRef, useSyncExternalStore } from "react";
import { Link as WouterLink, LinkProps } from "wouter";
import {
  getRememberedHomeHref,
  subscribeToRememberedHomeSearch,
} from "@/lib/home-search-memory";

export const RememberedHomeLink = forwardRef<HTMLAnchorElement, LinkProps>(
  (props, ref) => {
    const rememberedHomeHref = useSyncExternalStore(
      subscribeToRememberedHomeSearch,
      getRememberedHomeHref,
      getRememberedHomeHref
    );

    const resolvedProps =
      "to" in props && props.to !== undefined
        ? {
            ...props,
            to: props.to === "/" ? rememberedHomeHref : props.to,
          }
        : {
            ...props,
            href: props.href === "/" ? rememberedHomeHref : props.href,
          };

    if (resolvedProps.asChild) {
      return <WouterLink {...resolvedProps} />;
    }

    return <WouterLink {...resolvedProps} ref={ref} />;
  }
);
RememberedHomeLink.displayName = "RememberedHomeLink";
