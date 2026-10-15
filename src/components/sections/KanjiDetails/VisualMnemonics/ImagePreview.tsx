import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Always takes its final size (so nothing collapses while the object URL is
 * created), and fades the image in once it has loaded.
 */
export const ImagePreview = ({
  blob,
  description,
  thumbnail = false,
}: {
  blob: Blob;
  description: string;
  thumbnail?: boolean;
}) => {
  // The URL is stored with its blob so a stale image never shows for a frame
  // after the blob changes and before the effect creates the new URL.
  const [source, setSource] = useState<{ blob: Blob; url: string }>();
  const [loadedUrl, setLoadedUrl] = useState("");
  const url = source?.blob === blob ? source.url : "";

  // Effect needed: object URLs own browser resources and must be revoked on
  // replacement/unmount; render and event handlers cannot provide that cleanup.
  useEffect(() => {
    const next = URL.createObjectURL(blob);
    setSource({ blob, url: next });
    return () => URL.revokeObjectURL(next);
  }, [blob]);

  return (
    <div
      className={
        thumbnail
          ? "relative aspect-square size-20 max-w-[20vw] overflow-hidden rounded-lg"
          : "relative mx-auto aspect-square w-full max-w-lg overflow-hidden rounded-3xl border border-foreground/20"
      }
    >
      {url && (
        // A keyframe (not a transition) so the fade plays on every switch, even
        // when the new image decodes within the same frame.
        <img
          key={url}
          src={url}
          alt={description}
          onLoad={() => setLoadedUrl(url)}
          className={cn(
            "absolute inset-0 size-full object-contain",
            loadedUrl === url ? "animate-fade-in" : "opacity-0"
          )}
        />
      )}
    </div>
  );
};
