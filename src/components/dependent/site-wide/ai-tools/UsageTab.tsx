import { useEffect, useState, type ReactNode } from "react";
import { OwnedAiContent } from "@/components/common/OwnedAiContent";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { AiStorageBars } from "@/components/common/AiStorageBars";
import { Progress } from "@/components/ui/progress";
import {
  useAiExplainSettings,
  useAiExplainUsage,
  useAiStudyToolsActive,
} from "@/hooks/use-ai-explain";
import { useAiStorageUsage } from "@/hooks/use-ai-storage-usage";
import {
  hasValidKey,
  type AiProviderUsage,
} from "@/lib/ai-explain/preferences";
import {
  readElevenLabsBalance,
  type ElevenLabsBalance,
} from "@/lib/ai-explain/providers/elevenlabs";
import {
  AI_PROVIDER_ORDER,
  AI_PROVIDERS,
} from "@/lib/ai-explain/providers/capabilities";
import type { AiProvider } from "@/lib/ai-explain/providers/types";
import { AiContentStorageNote } from "./AiContentStorageNote";
import { DeleteAiContent } from "./DeleteAiContentDialog";

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
          {formatCount(usage.speechRequests)}{" "}
          {usage.speechRequests === 1 ? "MP3" : "MP3s"} ·{" "}
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

/**
 * Where saved AI content lives, and deleting it. How much is saved shows
 * just above (and in App & Device Info).
 */
const OwnedGeneratedStorage = () => {
  const toolsActive = useAiStudyToolsActive();
  return (
    <div className="mb-4 space-y-2">
      {/* While AI Study Tools are on, the same note shows above the tabs. */}
      {!toolsActive && <AiContentStorageNote />}
      <DeleteAiContent />
    </div>
  );
};

/**
 * Remounts for the new owner on login/logout, so an open "Delete saved AI
 * content" dialog can't carry over and delete with the other owner's choices.
 */
export const GeneratedStorageSettings = () => (
  <OwnedAiContent>
    <OwnedGeneratedStorage />
  </OwnedAiContent>
);

type BalanceState =
  | { status: "loading" }
  | { status: "done"; balance: ElevenLabsBalance }
  | { status: "error"; message: string };

/** ElevenLabs credits this billing period, fetched when the tab opens. */
const ElevenLabsCredits = ({ apiKey }: { apiKey: string }) => {
  const [state, setState] = useState<BalanceState>({ status: "loading" });

  // Effect needed: reads the balance from ElevenLabs when this tab opens;
  // render can't await a request, and a reply after unmount must be dropped.
  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    readElevenLabsBalance(apiKey).then(
      (balance) => active && setState({ status: "done", balance }),
      (error: unknown) =>
        active &&
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "",
        })
    );
    return () => {
      active = false;
    };
  }, [apiKey]);

  if (state.status === "loading")
    return (
      <p className="text-xs text-muted-foreground">
        Checking ElevenLabs credits…
      </p>
    );
  if (state.status === "error")
    return (
      <p className="text-xs text-muted-foreground">
        Couldn&apos;t read ElevenLabs credits. {state.message}
      </p>
    );
  const { used, limit, resetsAt } = state.balance;
  return (
    <section className="p-3 space-y-2 text-xs border rounded-xl animate-fade-in-fast">
      <h4 className="text-sm font-semibold">ElevenLabs credits</h4>
      <p className="tabular-nums">
        {formatCount(used)} of {formatCount(limit)} used
        {resetsAt &&
          ` · resets ${resetsAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
      </p>
      {limit > 0 && (
        <Progress
          value={Math.min(100, (used / limit) * 100)}
          className="h-2"
          aria-label="ElevenLabs credits used"
        />
      )}
      <p className="text-muted-foreground">
        From your ElevenLabs account, for all your use, not only this app.
      </p>
    </section>
  );
};

/** Saved text, MP3s and images on this device against their limits. */
const StorageBars = () => {
  const state = useAiStorageUsage();
  if (state.status === "loading")
    return <p className="text-xs text-muted-foreground">Checking storage…</p>;
  if (state.status === "error")
    return (
      <p className="text-xs text-muted-foreground">
        Couldn&apos;t read storage.
      </p>
    );
  return (
    <div className="space-y-4 animate-fade-in-fast">
      <AiStorageBars usage={state.usage} />
    </div>
  );
};

/**
 * Where each provider's own spending limit is set: the old in-app token
 * budget only counted text tokens in this browser.
 */
const SpendingLimits = () => {
  const [settings] = useAiExplainSettings();
  const withKeys = AI_PROVIDER_ORDER.filter(
    (provider) => settings.keys[provider].apiKey !== ""
  );
  const shown = withKeys.length > 0 ? withKeys : AI_PROVIDER_ORDER;
  return (
    <div className="space-y-2 text-xs">
      <p className="text-muted-foreground">
        To cap what AI Study Tools can cost, set a spending limit (or prepaid
        credits) with each provider:
      </p>
      <ul className="space-y-1">
        {shown.map((provider) => (
          <li key={provider}>
            {AI_PROVIDERS[provider].label}:{" "}
            <ExternalTextLink
              href={AI_PROVIDERS[provider].limitsUrl}
              text="limits and billing"
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

/** This month's usage, spending limits, and what's saved on this device. */
export const UsageTab = () => {
  const [settings] = useAiExplainSettings();
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">This month</h3>
        <AiUsage />
        {hasValidKey(settings, "elevenlabs") && (
          <ElevenLabsCredits apiKey={settings.keys.elevenlabs.apiKey} />
        )}
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Spending limits</h3>
        <SpendingLimits />
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Saved content</h3>
        <StorageBars />
        <GeneratedStorageSettings />
      </section>
    </div>
  );
};
