import { useEffect, useState } from "react";

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

  // Effect needed: object URLs own browser resources and must be revoked on
  // replacement/unmount; render and event handlers cannot provide that cleanup.
  useEffect(() => {
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);

  if (!url) return null;

  return (
    <img
      src={url}
      alt={description}
      className={
        thumbnail
          ? "aspect-square size-20 max-w-[20vw] rounded-lg object-contain"
          : "mx-auto aspect-square w-full max-w-lg rounded-3xl border border-foreground/20 object-contain"
      }
    />
  );
};
