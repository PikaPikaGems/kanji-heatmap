import { useId, useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { TextActionButton } from "@/components/common/AiActionButtons";
import { OwnedAiContent } from "@/components/common/OwnedAiContent";
import { UserNotice } from "@/components/common/UserNotice";
import {
  useAiExplainSettings,
  useAiExplainUsage,
} from "@/hooks/use-ai-explain";

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
    <dd className="min-w-0 text-right break-words">{children}</dd>
  </>
);

const formatCount = (n: number) => n.toLocaleString("en-US");

/** This month's AI usage, counted in this browser. */
const AiUsage = () => {
  const usage = useAiExplainUsage();
  const [settings] = useAiExplainSettings();
  const budget = settings.monthlyTokenBudget;

  return (
    <div className="space-y-3 text-xs">
      <UserNotice icon="💡" className="text-xs font-bold">
        This is only for AI Study Tools, which use your own xAI API key. If you
        haven&apos;t added one, you can ignore this section.
      </UserNotice>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
        <UsageRow label="Text tokens">
          <span className="tabular-nums">
            {formatCount(usage.tokens)}
            {budget !== undefined && ` / ${formatCount(budget)}`}
          </span>
        </UsageRow>
        <UsageRow label="Requests">{formatCount(usage.requests)}</UsageRow>
        <UsageRow label="Search calls">{usage.searchCalls}</UsageRow>
        <UsageRow label="Images">{usage.imageRequests}</UsageRow>
        <UsageRow label="Audio generations">{usage.audioRequests}</UsageRow>
        <UsageRow label="Speech characters">
          {formatCount(usage.audioCharacters)}
        </UsageRow>
        {usage.reportedCostUsd > 0 && (
          <UsageRow label="Provider-reported charges">
            US${usage.reportedCostUsd.toFixed(4)}
          </UsageRow>
        )}
      </dl>
      {budget !== undefined && (
        <Progress
          value={Math.min(100, (usage.tokens / budget) * 100)}
          className="h-2"
          primitiveCn={usage.tokens > budget ? "bg-red-500" : undefined}
          aria-label="Tokens used of the monthly budget"
        />
      )}
      <p className="text-muted-foreground">
        Counted in this browser only; restarts each month.
        {usage.unreportedSearchRequests > 0 &&
          ` ${usage.unreportedSearchRequests} searched requests had no provider-reported search count.`}{" "}
        Partial totals: check console.x.ai for your full bill.
      </p>
    </div>
  );
};

/** An optional monthly text-token budget, shown as a bar above. */
const BudgetField = () => {
  const [settings, update] = useAiExplainSettings();
  const budget = settings.monthlyTokenBudget;
  const id = useId();
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block mb-1 text-sm font-semibold">
        Monthly text-token budget (optional)
      </label>
      <Input
        className="rounded-lg"
        id={id}
        type="number"
        inputMode="numeric"
        min={1}
        step={1000}
        value={budget ?? ""}
        onChange={(e) => {
          const next = Math.floor(Number(e.target.value));
          update({ monthlyTokenBudget: next > 0 ? next : undefined });
        }}
        placeholder="e.g. 500000"
      />
      <p className="pt-1 text-xs text-muted-foreground">
        Counted in this browser only, and restarts each month. Requests
        incomplete or cancelled can still be billed. Local counters may omit
        these requests. This text-token budget is not a total spending limit for
        search, images, or speech, and nothing is blocked. Your exact usage is
        at <ExternalTextLink href="https://console.x.ai" text="console.x.ai" />.
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

/** This month's usage, the budget, and what's saved on this device. */
export const UsageTab = () => (
  <div className="space-y-6">
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">This month</h3>
      <AiUsage />
    </section>
    <BudgetField />
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">Saved content</h3>
      <GeneratedStorageSettings />
    </section>
  </div>
);
