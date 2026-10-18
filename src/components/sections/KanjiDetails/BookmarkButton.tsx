import { WriteBlockerCopy } from "@/components/dependent/account/WriteBlockedDialog";
import { useState } from "react";
import { GenericPopover } from "@/components/common/GenericPopover";
import { UserNotice } from "@/components/common/UserNotice";
import type { ActionStatus } from "@/components/dependent/account/action-status";
import { copyForCode, UPDATE_BROWSER_COPY } from "@/lib/engine/engine-copy";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { snapshotValue } from "@/lib/engine/store-cache";
import {
  type AccountStatus,
  getWriteBlocker,
  useAccountStatus,
} from "@/lib/engine/use-account-status";
import { useEngineApi, useEngineQuery } from "@/lib/engine/use-engine-query";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

const pillCn = (bookmarked: boolean) =>
  `inline-flex items-center gap-1.5 px-2 py-1 my-1 text-xs font-semibold rounded-full transition-colors whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60 ${
    bookmarked
      ? "bg-green-500/15 text-green-500 border border-green-500"
      : "border border-dashed border-foreground/50 text-muted-foreground hover:text-foreground"
  }`;

/** Logged in: reads `bookmarks.watch(kanji)` and toggles with add / remove. */
const ActiveBookmarkButton = ({
  kanji,
  status,
}: {
  kanji: string;
  status: Extract<AccountStatus, { kind: "active" }>;
}) => {
  const api = useEngineApi();
  const snapshot = useEngineQuery(`bookmarks.watch:${kanji}`, (engine) =>
    engine.bookmarks.watch(kanji)
  );
  const [action, setAction] = useState<ActionStatus>({ kind: "idle" });

  const current = snapshotValue(snapshot);
  const bookmarked = current === true;
  const blocker = getWriteBlocker(status);

  const toggle = async () => {
    if (!api || action.kind === "busy") return;
    setAction({ kind: "busy" });
    const result = bookmarked
      ? await api.bookmarks.remove(kanji)
      : await api.bookmarks.add(kanji);
    setAction(
      result.ok
        ? { kind: "idle" }
        : { kind: "error", message: copyForCode(result.error.code) }
    );
  };

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        className={pillCn(bookmarked)}
        disabled={
          !api || current === undefined || action.kind === "busy" || !!blocker
        }
        onClick={() => void toggle()}
      >
        {bookmarked ? "✓ Bookmarked" : "Bookmark"}
      </button>
      {blocker && (
        <UserNotice icon={null} className="text-xs text-right max-w-48">
          <WriteBlockerCopy blocker={blocker} />
        </UserNotice>
      )}
      {action.kind === "error" && (
        <p
          role="alert"
          className={cn("text-xs text-right max-w-48", cnWarningText)}
        >
          {action.message}
        </p>
      )}
    </div>
  );
};

/**
 * Bookmark pill in the kanji drawer. The engine's bookmark is per kanji, which
 * is the anchor word's bookmark too (they are 1:1). The caller hides it in
 * builds without the engine.
 */
export const BookmarkButton = ({ kanji }: { kanji: string }) => {
  const status = useAccountStatus();

  if (status.kind === "active") {
    return <ActiveBookmarkButton key={kanji} kanji={kanji} status={status} />;
  }
  if (status.kind === "signed-out") {
    return (
      <button type="button" className={pillCn(false)} onClick={openLoginDialog}>
        Bookmark
      </button>
    );
  }
  if (status.kind === "unavailable") {
    return (
      <GenericPopover
        trigger={
          <button type="button" className={pillCn(false)}>
            Bookmark
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
    <div className="flex flex-col items-end">
      <button type="button" className={pillCn(false)} disabled>
        Bookmark
      </button>
      {blocker && blocker !== "loading" && (
        <UserNotice icon={null} className="text-xs text-right max-w-48">
          <WriteBlockerCopy blocker={blocker} />
        </UserNotice>
      )}
    </div>
  );
};
