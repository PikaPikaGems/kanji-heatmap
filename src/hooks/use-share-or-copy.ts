import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

export const SITE_SHARE_TEXT =
  "Identify and study the kanji most useful to you";

export type SharePayload = {
  title: string;
  text: string;
  url: string;
};

export function useShareOrCopy(resetInterval = 1800) {
  const { copy, status } = useCopyToClipboard(resetInterval);
  const copied = status === "copied";

  const share = (payload: SharePayload) => {
    if (typeof navigator.share === "function") {
      void navigator.share(payload).catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        void copy(payload.url);
      });
      return;
    }
    void copy(payload.url);
  };

  return { share, copied };
}
