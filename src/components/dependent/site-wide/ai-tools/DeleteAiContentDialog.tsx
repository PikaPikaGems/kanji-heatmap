import { useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { TextActionButton } from "@/components/common/AiActionButtons";
import { DialogActions } from "@/components/common/DialogActions";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PracticeButton } from "@/components/ui/practice-button";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import {
  availableKinds,
  availableWhose,
  confirmPhrase,
  deletionBytes,
  groupTotal,
  includesMine,
  includesOthers,
  kindBytes,
  type AiContentDeletion,
  type AiContentKind,
  type AiContentWhose,
  type DeletableAiContent,
} from "@/lib/ai-explain/delete-content";
import { formatMegabytes } from "@/lib/format-bytes";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

const WHOSE_LABELS: Record<AiContentWhose, string> = {
  mine: "My content",
  guest: "Guest content",
  others: "Other accounts",
  everyone: "Everyone",
};

const KIND_LABELS: Record<AiContentKind, { label: string; details: string }> = {
  essays: {
    label: "Essays",
    details: "Kanji essays and vocabulary details, with their read-aloud audio",
  },
  audio: {
    label: "Read-aloud audio",
    details: "Every MP3, including those for published essays",
  },
  images: { label: "Images", details: "Visual mnemonics" },
};

/** One checkbox row: label, a muted line under it, and its size on the right. */
const SizedCheckbox = ({
  label,
  details,
  bytes,
  checked,
  onCheckedChange,
}: {
  label: string;
  details: string;
  bytes: number;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <label className="flex items-start gap-3 text-sm cursor-pointer">
    <Checkbox
      className="mt-0.5"
      checked={checked}
      onCheckedChange={(next) => onCheckedChange(next === true)}
    />
    <span className="flex-1">
      {label}
      <span className="block text-xs text-muted-foreground">{details}</span>
    </span>
    <span className="text-muted-foreground tabular-nums">
      {formatMegabytes(bytes)}
    </span>
  </label>
);

const Warning = ({ children }: { children: ReactNode }) => (
  <p className={cn("text-sm text-pretty", cnWarningText)}>{children}</p>
);

/** The kinds a "whose" choice starts with: its only kind, else none. */
const startingKinds = (
  content: DeletableAiContent,
  whose: AiContentWhose | null
) => {
  const kinds = availableKinds(
    whose === null ? undefined : content.groups[whose]
  );
  return kinds.length === 1 ? kinds : [];
};

/** A lone choice starts picked; otherwise nothing is. */
const startingDeletion = (content: DeletableAiContent): AiContentDeletion => {
  const whoseChoices = availableWhose(content);
  const whose = whoseChoices.length === 1 ? whoseChoices[0] : null;
  return {
    whose,
    kinds: startingKinds(content, whose),
    sharedExplains: whoseChoices.length === 0 && content.sharedExplains > 0,
  };
};

type DeleteRequest =
  | { status: "idle" }
  | { status: "deleting" }
  | { status: "done"; bytes: number }
  | { status: "error" };

/**
 * Whose content, which kinds, and the phrase that confirms it. Delete stays
 * off until the phrase is typed exactly.
 */
const DeleteAiContentForm = ({
  content,
  onClose,
}: {
  content: DeletableAiContent;
  onClose: () => void;
}) => {
  const [deletion, setDeletion] = useState(() => startingDeletion(content));
  const [typed, setTyped] = useState("");
  const [request, setRequest] = useState<DeleteRequest>({ status: "idle" });

  const whoseChoices = availableWhose(content);
  const { whose } = deletion;
  const sizes = whose === null ? undefined : content.groups[whose];
  const phrase = confirmPhrase(content, deletion);
  const bytes = deletionBytes(content, deletion);
  const ready = phrase !== "" && typed === phrase && bytes > 0;

  const remove = async () => {
    setRequest({ status: "deleting" });
    try {
      const { deleteAiContent } = await import("@/lib/ai-explain/storage");
      setRequest({ status: "done", bytes: await deleteAiContent(deletion) });
    } catch {
      setRequest({ status: "error" });
    }
  };

  if (request.status === "done")
    return (
      <div className="flex flex-col gap-5 px-2 pt-1 text-left animate-fade-in-fast">
        <p className="text-sm">Deleted {formatMegabytes(request.bytes)}.</p>
        <DialogActions>
          <PracticeButton onClick={onClose}>Close</PracticeButton>
        </DialogActions>
      </div>
    );

  if (whoseChoices.length === 0 && content.sharedExplains === 0)
    return (
      <div className="flex flex-col gap-5 px-2 pt-1 text-left">
        <p className="text-sm">There&apos;s no saved AI content to delete.</p>
        <DialogActions>
          <PracticeButton onClick={onClose}>Close</PracticeButton>
        </DialogActions>
      </div>
    );

  const toggleKind = (kind: AiContentKind) => (checked: boolean) =>
    setDeletion({
      ...deletion,
      kinds: checked
        ? [...deletion.kinds, kind]
        : deletion.kinds.filter((picked) => picked !== kind),
    });
  const picked = deletion.kinds.length > 0 || deletion.sharedExplains;

  return (
    <div className="flex flex-col gap-5 px-2 pt-1 text-left">
      {whoseChoices.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-bold">Whose content</legend>
          {whoseChoices.map((choice) => (
            <label
              key={choice}
              className="flex items-center gap-3 p-3 text-sm border cursor-pointer rounded-xl has-[:checked]:border-primary"
            >
              <input
                type="radio"
                name="delete-ai-content-whose"
                checked={whose === choice}
                onChange={() =>
                  setDeletion({
                    ...deletion,
                    whose: choice,
                    kinds: startingKinds(content, choice),
                  })
                }
                className="accent-primary"
              />
              <span className="flex-1">{WHOSE_LABELS[choice]}</span>
              <span className="text-muted-foreground tabular-nums">
                {formatMegabytes(groupTotal(content.groups[choice]!))}
              </span>
            </label>
          ))}
        </fieldset>
      )}
      {sizes && (
        // Keyed by the choice so its kinds fade in when it changes.
        <fieldset
          key={whose}
          className="flex flex-col gap-3 animate-fade-in-fast"
        >
          <legend className="mb-2 text-sm font-bold">What to delete</legend>
          {availableKinds(sizes).map((kind) => (
            <SizedCheckbox
              key={kind}
              label={KIND_LABELS[kind].label}
              details={KIND_LABELS[kind].details}
              bytes={kindBytes(sizes, kind)}
              checked={deletion.kinds.includes(kind)}
              onCheckedChange={toggleKind(kind)}
            />
          ))}
        </fieldset>
      )}
      {content.sharedExplains > 0 && (
        <div
          className={cn(
            whoseChoices.length > 0 && "pt-4 border-t-2 border-dashed"
          )}
        >
          <SizedCheckbox
            label="Shared explains"
            details="Every AI Explain answer on this device"
            bytes={content.sharedExplains}
            checked={deletion.sharedExplains}
            onCheckedChange={(checked) =>
              setDeletion({ ...deletion, sharedExplains: checked })
            }
          />
        </div>
      )}
      {picked && (
        <div className="flex flex-col gap-2 animate-fade-in-fast">
          <Warning>⚠️ This can&apos;t be undone. Nothing is backed up.</Warning>
          {includesOthers(deletion) && (
            <Warning>
              ⚠️ People who use this browser lose their essays, images and MP3s,
              and they won&apos;t be told.
            </Warning>
          )}
          {includesMine(deletion) && (
            <p className="text-sm text-muted-foreground">
              Download anything you want to keep first.
            </p>
          )}
        </div>
      )}
      {phrase !== "" && (
        <label className="flex flex-col gap-2 text-sm">
          <span>
            To confirm, type: <strong className="font-mono">{phrase}</strong>
          </span>
          <Input
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            // Phones would otherwise capitalize or correct it, so it never matches.
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
      )}
      {request.status === "error" && (
        <Warning>Couldn&apos;t delete all of it. Try again.</Warning>
      )}
      <DialogActions>
        <PracticeButton variant="ghost" onClick={onClose}>
          Cancel
        </PracticeButton>
        <PracticeButton
          variant="danger"
          disabled={!ready || request.status === "deleting"}
          onClick={remove}
        >
          {request.status === "deleting"
            ? "Deleting…"
            : picked
              ? `Delete ${formatMegabytes(bytes)}`
              : "Delete"}
        </PracticeButton>
      </DialogActions>
    </div>
  );
};

type DialogState =
  | { status: "closed" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "open"; content: DeletableAiContent };

/**
 * "Delete saved AI content…" and its dialog. Sizes are read when it opens,
 * for what the current owner may delete: a guest only their own, a signed-in
 * user anyone's on this device, plus the shared AI Explain answers.
 */
export const DeleteAiContent = () => {
  const [state, setState] = useState<DialogState>({ status: "closed" });
  const open = async () => {
    setState({ status: "loading" });
    try {
      const { getDeletableAiContent } = await import(
        "@/lib/ai-explain/storage"
      );
      setState({ status: "open", content: await getDeletableAiContent() });
    } catch {
      setState({ status: "error" });
    }
  };
  const close = () => setState({ status: "closed" });
  return (
    <div className="space-y-2">
      {state.status === "error" && (
        <Warning>Couldn&apos;t read saved AI content. Try again.</Warning>
      )}
      <TextActionButton
        icon={<Trash2 size={14} />}
        className="text-rose-500"
        busy={state.status === "loading"}
        busyLabel="Checking…"
        onClick={open}
      >
        Delete saved AI content…
      </TextActionButton>
      <Dialog
        open={state.status === "open"}
        onOpenChange={(next) => {
          if (!next) close();
        }}
      >
        <ScrollableDialogContent
          size="md"
          title="Delete saved AI content?"
          description="Choose whose content and which kinds to delete"
          titleClassName="text-left"
        >
          {state.status === "open" && (
            <DeleteAiContentForm content={state.content} onClose={close} />
          )}
        </ScrollableDialogContent>
      </Dialog>
    </div>
  );
};
