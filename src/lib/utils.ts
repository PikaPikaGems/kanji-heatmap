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

