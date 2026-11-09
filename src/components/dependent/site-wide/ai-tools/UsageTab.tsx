import { useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { TextActionButton } from "@/components/common/AiActionButtons";
import { OwnedAiContent } from "@/components/common/OwnedAiContent";
import { useAiExplainUsage } from "@/hooks/use-ai-explain";
import type { AiProviderUsage } from "@/lib/ai-explain/preferences";
import {
  AI_PROVIDER_ORDER,
  AI_PROVIDERS,
} from "@/lib/ai-explain/providers/capabilities";
import type { AiProvider } from "@/lib/ai-explain/providers/types";

/** A label and its value, one row of a two-column list. */
const UsageRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <>
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="min-w-0 text-right break-words tabular-nums">{children}</dd>
  </>
);

const formatCount = (n: number) => n.toLocaleString("en-US");

/**
 * One provider's month, in its own units. Rows it never reported are left
 * out; money only when its API returned an amount.
 */
const ProviderUsage = ({
  provider,
  usage,
}: {
  provider: AiProvider;
  usage: AiProviderUsage;
}) => (
  <section className="p-3 space-y-2 text-xs border rounded-xl">
    <h4 className="text-sm font-semibold">{AI_PROVIDERS[provider].label}</h4>
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
      <UsageRow label="Requests">{formatCount(usage.requests)}</UsageRow>
      {usage.tokens > 0 && (
        <UsageRow label="Tokens">
          {formatCount(usage.tokens)}
          {usage.inputTokens + usage.outputTokens > 0 &&
            ` (${formatCount(usage.inputTokens)} in · ${formatCount(usage.outputTokens)} out)`}
        </UsageRow>
      )}
      {(usage.searches > 0 || usage.unreportedSearches > 0) && (
        <UsageRow label="Web searches">
          {formatCount(usage.searches)}
          {usage.unreportedSearches > 0 &&
            ` (+${usage.unreportedSearches} requests that didn't say)`}
        </UsageRow>
      )}
      {usage.images > 0 && (
        <UsageRow label="Images">{formatCount(usage.images)}</UsageRow>
      )}
      {usage.speechRequests > 0 && (
        <UsageRow label="Speech">
          {formatCount(usage.speechRequests)} MP3s ·{" "}
          {formatCount(usage.characters)} characters
        </UsageRow>
      )}
      {usage.credits > 0 && (
        <UsageRow label="Credits">{formatCount(usage.credits)}</UsageRow>
      )}
      {usage.reportedCostUsd > 0 && (
        <UsageRow label="Cost reported by the API">
          US${usage.reportedCostUsd.toFixed(4)}
        </UsageRow>
      )}
    </dl>
  </section>
);

/** This month's usage per provider, counted in this browser. */
const AiUsage = () => {
  const usage = useAiExplainUsage();
  const used = AI_PROVIDER_ORDER.filter(
    (provider) => usage.providers[provider]
  );
  return (
    <div className="space-y-3">
      {used.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No AI requests from this browser this month.
        </p>
      )}
      {used.map((provider) => (
        <ProviderUsage
          key={provider}
          provider={provider}
          usage={usage.providers[provider]!}
        />
      ))}
      <p className="text-xs text-muted-foreground">
        Counted in this browser only, in each provider&apos;s own units;
        restarts each month. Requests cancelled midway can still be billed. Your
        provider&apos;s dashboard has the full bill.
      </p>
    </div>
  );
};

type StorageStatus =
  | { status: "idle" }
  | { status: "confirm" }
  | { status: "clearing" }
  | { status: "cleared" }
  | { status: "error"; message: string };

/**
 * Deletes this owner's saved AI text, images and MP3s. How much is saved is
 * in App & Device Info (Storage on this device).
 */
const OwnedGeneratedStorage = () => {
  const [state, setState] = useState<StorageStatus>({ status: "idle" });
  const clear = async () => {
    setState({ status: "clearing" });
    try {
      const { clearGeneratedContent } = await import(
        "@/lib/ai-explain/storage"
      );
      await clearGeneratedContent();
      setState({ status: "cleared" });
    } catch {
      setState({
        status: "error",
        message: "Couldn't clear all generated content. Try again.",
      });
    }
  };
  if (state.status === "confirm")
    return (
      <div className="mb-4 space-y-2">
        <p className="text-sm">
          Delete all saved AI text, images, and MP3s from this browser? Download
          anything you want to keep first. Your API key and preferences stay
          saved.
        </p>
        <div className="flex flex-wrap items-center gap-1">
          <TextActionButton
            icon={<Trash2 size={14} />}
            className="text-rose-500"
            onClick={clear}
          >
            Delete generated content
          </TextActionButton>
          <span aria-hidden>·</span>
          <TextActionButton onClick={() => setState({ status: "idle" })}>
            Cancel
          </TextActionButton>
        </div>
      </div>
    );
  return (
    <div className="mb-4 space-y-2">
      {state.status === "cleared" && (
        <p className="text-sm">Generated content deleted.</p>
      )}
      {state.status === "error" && <p className="text-sm">{state.message}</p>}
      <p className="text-xs text-muted-foreground">
        Saved only on this device and browser, and not private: anyone with
        access to this computer can see it. Browser data can be cleared or lost.
        Download content you want to keep. See how much is saved in App & Device
        Info.
      </p>
      <TextActionButton
        icon={<Trash2 size={14} />}
        className="text-rose-500"
        busy={state.status === "clearing"}
        busyLabel="Clearing…"
        onClick={() => setState({ status: "confirm" })}
      >
        Clear generated content
      </TextActionButton>
    </div>
  );
};

/**
 * Remounts for the new owner on login/logout, so a pending "Delete generated
 * content" confirmation can't carry over and delete the other owner's content.
 */
export const GeneratedStorageSettings = () => (
  <OwnedAiContent>
    <OwnedGeneratedStorage />
  </OwnedAiContent>
);

/** This month's usage, and what's saved on this device. */
export const UsageTab = () => (
  <div className="space-y-6">
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">This month</h3>
      <AiUsage />
    </section>
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">Saved content</h3>
      <GeneratedStorageSettings />
    </section>
  </div>
);
