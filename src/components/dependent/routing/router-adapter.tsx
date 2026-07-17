import { forwardRef, useSyncExternalStore } from "react";
import {
  Link as WouterLink,
  LinkProps,
  Route,
  Switch,
  useLocation,
  useSearch,
  useSearchParams,
} from "wouter";
import {
  getRememberedHomeHref,
  subscribeToRememberedHomeSearch,
} from "@/lib/home-search-memory";

const Link = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
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
});
Link.displayName = "Link";

export { Route, Switch, Link, useLocation, useSearch, useSearchParams };
