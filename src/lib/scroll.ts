/** Brings a just-finished AI result's top into view (no smooth scroll for reduced motion). */
export const scrollResultIntoView = (element: HTMLElement | null) => {
  const reduceMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  element?.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
};
