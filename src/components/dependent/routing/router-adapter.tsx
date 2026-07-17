import {
  ComponentPropsWithoutRef,
  ComponentRef,
  forwardRef,
  useSyncExternalStore,
} from "react";
import {
  Link as WouterLink,
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

type LinkProps = ComponentPropsWithoutRef<typeof WouterLink>;

const Link = forwardRef<ComponentRef<typeof WouterLink>, LinkProps>(
  ({ href, to, ...props }, ref) => {
    const rememberedHomeHref = useSyncExternalStore(
      subscribeToRememberedHomeSearch,
      getRememberedHomeHref,
      getRememberedHomeHref
    );

    return (
      <WouterLink
        {...props}
        ref={ref}
        href={href === "/" ? rememberedHomeHref : href}
        to={to === "/" ? rememberedHomeHref : to}
      />
    );
  }
);
Link.displayName = "Link";

export { Route, Switch, Link, useLocation, useSearch, useSearchParams };
