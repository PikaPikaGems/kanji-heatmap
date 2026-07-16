import { useEffect, useRef, useState } from "react";

/** True when radix/remove-scroll has locked the body (modals, selects, etc.). */
const isBodyScrollLocked = () => {
  const { body } = document;
  return (
    body.style.overflow === "hidden" ||
    body.style.paddingRight !== "" ||
    body.hasAttribute("data-scroll-locked") ||
    getComputedStyle(body)
      .getPropertyValue("--removed-body-scroll-bar-size")
      .trim() !== ""
  );
};

/** Bumps whenever scroll-lock toggles so fixed UI can fade instead of hard-jumping. */
export const useScrollLockFadeTick = () => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let prev = isBodyScrollLocked();

    const onChange = () => {
      const next = isBodyScrollLocked();
      if (next === prev) return;
      prev = next;
      setTick((n) => n + 1);
    };

    const observer = new MutationObserver(onChange);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "class", "data-scroll-locked"],
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => observer.disconnect();
  }, []);

  return tick;
};

const SETTLE_CN = "animate-scroll-lock-settle";

/** Ref that restarts a soft fade whenever body scroll-lock toggles. */
export const useScrollLockSettleRef = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const fadeTick = useScrollLockFadeTick();

  useEffect(() => {
    if (fadeTick === 0) return;
    const el = ref.current;
    if (!el) return;
    el.classList.remove(SETTLE_CN);
    // Force reflow so the animation can restart.
    void el.offsetWidth;
    el.classList.add(SETTLE_CN);
  }, [fadeTick]);

  return ref;
};
