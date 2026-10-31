import { useState } from "react";
import type { SyncOperation } from "engine-contract";
import { Pagination } from "@/components/sections/KanjiDetails/Pagination";
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

/** One page of the outbox; each page is its own cached store. */
const PendingPage = ({ offset }: { offset: number }) => {
  const snapshot = useEngineQuery(
    `sync.watchOutbox:${PAGE_SIZE}:${offset}`,
    (api) => keepLastReady(api.sync.watchOutbox({ limit: PAGE_SIZE, offset }))
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
      {outbox.pendingSyncOperations.map((op) => (
        <PendingRow key={op.operationId} op={op} />
      ))}
    </>
  );
};

/**
 * Changes still waiting to upload, 10 per page with the drawer's
 * "← 1 of 4 →" pagination. Only the page shown is read from the engine.
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
    <div className="flex flex-col">
      <div key={shown} className="animate-fade-in-fast">
        <OperationList>
          <PendingPage offset={(shown - 1) * PAGE_SIZE} />
        </OperationList>
      </div>
      {totalPages > 1 && (
        <Pagination
          page={shown}
          totalPages={totalPages}
          onPrev={() => setPage(shown - 1)}
          onNext={() => setPage(shown + 1)}
        />
      )}
    </div>
  );
};
