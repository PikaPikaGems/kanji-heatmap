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
  const [url, setUrl] = useState("");
  const [loadedUrl, setLoadedUrl] = useState("");

  // Effect needed: object URLs own browser resources and must be revoked on
  // replacement/unmount; render and event handlers cannot provide that cleanup.
  useEffect(() => {
    const next = URL.createObjectURL(blob);
    setUrl(next);
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
        <img
          src={url}
          alt={description}
          onLoad={() => setLoadedUrl(url)}
          className={cn(
            "absolute inset-0 size-full object-contain transition-opacity duration-500 ease-out",
            loadedUrl === url ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </div>
  );
};
