import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { CheckCircle, Copy } from "@/components/icons";
import { cn } from "@/lib/utils";

export const ErrorTerminal = ({
  content,
  filename = "error.log",
  className,
}: {
  content: string;
  filename?: string;
  className?: string;
}) => {
  const { copy, status } = useCopyToClipboard(1500);
  const copied = status === "copied";

  return (
    <div
      className={cn(
        "w-full max-w-md overflow-hidden text-left rounded-xl border border-neutral-700 bg-[#0d1117] shadow-lg",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-neutral-700 bg-[#161b22] px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex gap-1 shrink-0" aria-hidden>
            <span className="size-2.5 rounded-full bg-[#ff5f56]" />
            <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="size-2.5 rounded-full bg-[#27c93f]" />
          </span>
          <span className="truncate font-mono text-[11px] text-neutral-400">
            {filename}
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            void copy(content, e);
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
          aria-label={copied ? "Copied" : "Copy error report"}
        >
          {copied ? (
            <>
              <CheckCircle className="size-3.5 text-emerald-400" />
              <span className="text-emerald-400">copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span>copy</span>
            </>
          )}
        </button>
      </div>
      <pre
        className="max-h-48 overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-[11px] leading-relaxed text-[#c9d1d9] selection:bg-emerald-500/30"
        tabIndex={0}
      >
        {content}
      </pre>
    </div>
  );
};
