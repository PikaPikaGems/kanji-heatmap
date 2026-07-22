import { useLayoutEffect } from "react";
import {
  useLocation,
  useSearch,
} from "@/components/dependent/routing/router-hooks";
import { rememberPracticeReturnHref } from "@/lib/practice-return-path";

/** Keeps the last non-practice route so practice screens can leave via wouter. */
export const PracticeReturnPathMemory = () => {
  const [location] = useLocation();
  const search = useSearch();

  useLayoutEffect(() => {
    rememberPracticeReturnHref(search ? `${location}?${search}` : location);
  }, [location, search]);

  return null;
};
