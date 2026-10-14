import { useState } from "react";
import { Loader2, PlusCircle } from "lucide-react";
import { REVIEW_PILE_ADD_WORD_MAX_UTF8_BYTES } from "engine-contract";
import { GenericPopover } from "@/components/common/GenericPopover";
import type { ActionStatus } from "@/components/dependent/account/action-status";
import { Button } from "@/components/ui/button";
import {
  copyForCode,
  copyForWriteBlocker,
  UPDATE_BROWSER_COPY,
} from "@/lib/engine/engine-copy";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { snapshotValue } from "@/lib/engine/store-cache";
import {
  type AccountStatus,
  getWriteBlocker,
  type WriteBlocker,
  useAccountStatus,
} from "@/lib/engine/use-account-status";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import { useReviewPileItem } from "@/lib/engine/use-review-pile-item";
import { utf8ByteLength } from "./KanjiStudyNotes/utf8-bytes";

const addCn =
  "flex text-left gap-2 px-2 py-2 text-sm font-bold underline rounded-lg decoration-dotted underline-offset-4 hover:text-green-400 text-green-500 hover:decoration-solid disabled:cursor-not-allowed disabled:opacity-60 disabled:no-underline";

const AddLabel = ({ word }: { word: string }) => (
  <>
    <PlusCircle size={16} className="translate-y-0.5 shrink-0" /> Add {word} to
    my review pile
  </>
);

const Note = ({
  children,
  tone,
}: {
  children: string;
  tone: "muted" | "error";
}) => (
  <p
    role={tone === "error" ? "alert" : undefined}
    className={`px-2 max-w-56 text-xs text-left ${
      tone === "error" ? "text-destructive" : "text-muted-foreground"
    }`}
  >
    {children}
  </p>
);

/** The confirmation inside the Remove popover; it owns the remove call. */
const ConfirmRemove = ({
  kanji,
  onCancel,
}: {
  kanji: string;
  onCancel: () => void;
}) => {
  const api = useEngineApi();
  const [action, setAction] = useState<ActionStatus>({ kind: "idle" });
  const busy = action.kind === "busy";

  const remove = async () => {
    if (!api || busy) return;
    setAction({ kind: "busy" });
    const result = await api.reviews.pile.remove(kanji);
    // On success the pile watch flips to "not in pile" and this unmounts.
    setAction(
      result.ok
        ? { kind: "idle" }
        : { kind: "error", message: copyForCode(result.error.code) }
    );
  };

  return (
    <div className="flex flex-col gap-3 p-4 text-sm text-left w-64">
      <div className="flex flex-col gap-1">
        <p className="font-semibold">Remove {kanji} from your review pile?</p>
        <p className="text-muted-foreground">
          Removing and adding it again later restarts both reading and writing
          from scratch.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          disabled={!api || busy}
          onClick={() => void remove()}
        >
          {busy && <Loader2 className="animate-spin" />}
          Remove
        </Button>
        <Button variant="outline" size="sm" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {action.kind === "error" && (
        <p role="alert" className="text-xs text-destructive">
          {action.message}
        </p>
      )}
    </div>
  );
};

const RemoveFromPile = ({
  kanji,
  blocker,
}: {
  kanji: string;
  blocker: WriteBlocker | null;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <GenericPopover
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          type="button"
          disabled={!!blocker}
          className="text-xs underline rounded decoration-dotted underline-offset-4 text-muted-foreground hover:text-destructive hover:decoration-solid disabled:cursor-not-allowed disabled:opacity-60 disabled:no-underline"
        >
          Remove
        </button>
      }
      content={<ConfirmRemove kanji={kanji} onCancel={() => setOpen(false)} />}
    />
  );
};

/** Logged in: reads `reviews.pile.watch(kanji)`, adds with the anchor word. */
const ActiveReviewPileButton = ({
  kanji,
  word,
  status,
}: {
  kanji: string;
  word: string;
  status: Extract<AccountStatus, { kind: "active" }>;
}) => {
  const api = useEngineApi();
  const snapshot = useReviewPileItem(kanji);
  const [action, setAction] = useState<ActionStatus>({ kind: "idle" });

  const current = snapshotValue(snapshot);
  const blocker = getWriteBlocker(status);

  if (current) {
    return (
      <div className="flex flex-col items-start min-w-0">
        <div className="flex flex-wrap items-center px-2 py-2 text-sm gap-x-3 gap-y-1">
          <span className="font-bold text-green-500">✓ In review pile</span>
          <RemoveFromPile kanji={kanji} blocker={blocker} />
        </div>
        {blocker && <Note tone="muted">{copyForWriteBlocker(blocker)}</Note>}
      </div>
    );
  }

  const tooLong = utf8ByteLength(word) > REVIEW_PILE_ADD_WORD_MAX_UTF8_BYTES;

  const add = async () => {
    if (!api || action.kind === "busy") return;
    setAction({ kind: "busy" });
    const result = await api.reviews.pile.add({ kanji, word });
    // On success the pile watch flips to "in pile" and this view is replaced.
    setAction(
      result.ok
        ? { kind: "idle" }
        : { kind: "error", message: copyForCode(result.error.code) }
    );
  };

  return (
    <div className="flex flex-col items-start min-w-0">
      <button
        type="button"
        className={addCn}
        disabled={
          !api ||
          current === undefined ||
          action.kind === "busy" ||
          !!blocker ||
          tooLong
        }
        onClick={() => void add()}
      >
        {action.kind === "busy" ? (
          <Loader2 size={16} className="translate-y-0.5 animate-spin" />
        ) : (
          <PlusCircle size={16} className="translate-y-0.5 shrink-0" />
        )}
        Add {word} to my review pile
      </button>
      {blocker && <Note tone="muted">{copyForWriteBlocker(blocker)}</Note>}
      {tooLong && <Note tone="error">{copyForCode("validation_failed")}</Note>}
      {action.kind === "error" && <Note tone="error">{action.message}</Note>}
    </div>
  );
};

/**
 * Review-pile control in the kanji drawer: add the anchor word, or see that
 * it is in the pile and remove it. The caller hides it in builds without the
 * engine.
 */
export const ReviewPileButton = ({
  kanji,
  word,
}: {
  kanji: string;
  word: string;
}) => {
  const status = useAccountStatus();

  if (status.kind === "active") {
    return (
      <ActiveReviewPileButton
        key={kanji}
        kanji={kanji}
        word={word}
        status={status}
      />
    );
  }
  if (status.kind === "signed-out") {
    return (
      <button type="button" className={addCn} onClick={openLoginDialog}>
        <AddLabel word={word} />
      </button>
    );
  }
  if (status.kind === "unavailable") {
    return (
      <GenericPopover
        trigger={
          <button type="button" className={addCn}>
            <AddLabel word={word} />
          </button>
        }
        content={
          <div className="p-3 text-sm max-w-64">{UPDATE_BROWSER_COPY}</div>
        }
      />
    );
  }

  // Still loading, or the account is in an error / recovery state.
  const blocker = getWriteBlocker(status);
  return (
    <div className="flex flex-col items-start min-w-0">
      <button type="button" className={addCn} disabled>
        <AddLabel word={word} />
      </button>
      {blocker && blocker !== "loading" && (
        <Note tone="muted">{copyForWriteBlocker(blocker)}</Note>
      )}
    </div>
  );
};
