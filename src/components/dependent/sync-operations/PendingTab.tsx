import { useState } from "react";
import type { SyncOperation } from "engine-contract";
import { relativeTime } from "@/lib/engine/relative-time";
import { keepLastReady, snapshotValue } from "@/lib/engine/store-cache";
import { useEngineQuery } from "@/lib/engine/use-engine-query";
import {
  describeOperation,
  operationIcon,
  operationKanji,
} from "./operation-info";
import {
  EmptyOperations,
  OperationIcon,
  OperationKanji,
  OperationList,
} from "./OperationList";
import { PagedOperations } from "./PagedOperations";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

/** Rows per page, so the list fits the dialog without a long scroll. */
const PAGE_SIZE = 10;

const PendingRow = ({ op }: { op: SyncOperation }) => {
  const kanji = operationKanji(op);
  const queuedAt = Date.parse(op.clientUpdatedAt);

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <OperationIcon Icon={operationIcon(op.type)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{describeOperation(op)}</p>
        {!Number.isNaN(queuedAt) && (
          <p className="text-xs text-muted-foreground">
            {relativeTime(queuedAt)}
          </p>
        )}
      </div>
      {kanji !== undefined && <OperationKanji kanji={kanji} />}
    </li>
  );
};

/**
 * One page of the outbox, newest first; each page is its own cached store.
 * The engine lists the outbox in upload order (oldest first), so page 1 is
 * read from the end and reversed.
 *
 * Workaround: remove the end-offset math and the reverse once
 * `sync.watchOutbox()` can list newest first itself
 * (PikaPikaGems/experimental-engine-docs#120). Until then `total` comes from
 * a separate status read, so a page can be off by a row for a moment.
 */
const PendingPage = ({ page, total }: { page: number; total: number }) => {
  const end = Math.max(0, total - (page - 1) * PAGE_SIZE);
  const offset = Math.max(0, end - PAGE_SIZE);
  const limit = end - offset;
  const snapshot = useEngineQuery(
    `sync.watchOutbox:${limit}:${offset}`,
    (api) => keepLastReady(api.sync.watchOutbox({ limit, offset }))
  );

  if (snapshot.status === "loading") {
    return (
      <li className="px-3 py-3 text-sm text-muted-foreground">Loading…</li>
    );
  }
  const outbox = snapshotValue(snapshot);
  if (!outbox) {
    return (
      <li className={cn("px-3 py-3 text-sm", cnWarningText)}>
        ⚠️ Couldn&apos;t load pending changes.
      </li>
    );
  }
  return (
    <>
      {[...outbox.pendingSyncOperations].reverse().map((op) => (
        <PendingRow key={op.operationId} op={op} />
      ))}
    </>
  );
};

/**
 * Changes still waiting to upload, newest first, 10 per page with the
 * drawer's "← 1 of 4 →" pagination above and below. Only the page shown is
 * read from the engine. Uploads take the oldest first, so they shrink the
 * last page and the first page stays put.
 */
export const PendingTab = ({ total }: { total: number }) => {
  const [page, setPage] = useState(1);

  if (total === 0) {
    return (
      <EmptyOperations icon="✅">Nothing is waiting to upload.</EmptyOperations>
    );
  }
  const totalPages = Math.ceil(total / PAGE_SIZE);
  // Uploads shrink the list while it is open: stay on its last page.
  const shown = Math.min(page, totalPages);
  return (
    <PagedOperations
      page={shown}
      totalPages={totalPages}
      onPageChange={setPage}
    >
      <OperationList>
        <PendingPage page={shown} total={total} />
      </OperationList>
    </PagedOperations>
  );
};
