import { useState, type ComponentProps, type ReactNode } from "react";
import { Download, RotateCcw } from "lucide-react";
import { downloadBlob } from "@/lib/ai-explain/download";
import { cnDottedUnderlineTrigger } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

/** The one style for secondary AI actions: bold text, dotted underline, icon. */
export const TextActionButton = ({
  icon,
  children,
  className,
  ...props
}: ComponentProps<"button"> & { icon: ReactNode }) => (
  <button
    type="button"
    {...props}
    className={cn(cnDottedUnderlineTrigger, "disabled:opacity-50", className)}
  >
    {icon}
    <strong>{children}</strong>
  </button>
);

export const RegenerateButton = ({
  children = "Regenerate",
  ...props
}: Omit<ComponentProps<typeof TextActionButton>, "icon">) => (
  <TextActionButton icon={<RotateCcw size={14} />} {...props}>
    {children}
  </TextActionButton>
);

export const DownloadButton = ({
  children,
  ...props
}: Omit<ComponentProps<typeof TextActionButton>, "icon">) => (
  <TextActionButton icon={<Download size={14} />} {...props}>
    {children}
  </TextActionButton>
);

export const DownloadMarkdownButton = ({
  markdown,
  filename,
}: {
  markdown: string;
  filename: string;
}) => {
  const [error, setError] = useState("");
  return (
    <span className="inline-flex flex-col">
      <DownloadButton
        onClick={() => {
          try {
            downloadBlob(
              new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
              filename
            );
            setError("");
          } catch {
            setError("Couldn't download the Markdown. Copy it instead.");
          }
        }}
      >
        Download Markdown
      </DownloadButton>
      {error && (
        <span role="alert" className="text-xs font-bold text-destructive">
          {error}
        </span>
      )}
    </span>
  );
};
