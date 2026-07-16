import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const selectRandom = <T>(arr: T[]) => {
  const random = Math.floor(Math.random() * arr.length);
  return arr[random];
};

export const clamp = (num: number, min: number, max: number) => {
  return Math.min(max, Math.max(num, min));
};

/** Rounded percentage of `part` out of `total`, or `fallback` when total is 0. */
export const percent = (part: number, total: number, fallback = 0) =>
  total > 0 ? Math.round((100 * part) / total) : fallback;

/** Rounded mean of a numeric array, or null when empty. */
export const roundedMean = (nums: number[]): number | null =>
  nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;

export const toNum = (str?: string | null | number, fallback?: number) => {
  if (typeof str === "string" && !Number.isNaN(Number(str))) {
    return Number(str);
  }

  return fallback ?? 0;
};

export const checkIfInputField = (target: HTMLElement) => {
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  );
};

export const isKanji = (char: string) => {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9faf) || // CJK Unified Ideographs
    (code >= 0x3400 && code <= 0x4dbf) // CJK Unified Ideographs Extension A
  );
};

export const dedupe = <T>(items: T[]): T[] => {
  const seen = new Set<T>();
  return items.filter((item) => {
    if (seen.has(item)) return false;
    seen.add(item);
    return true;
  });
};

export const shuffle = <T>(items: T[]): T[] => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};
