import { useState } from "react";
import type { SyncOperation } from "engine-contract";
import { TextActionButton } from "@/components/common/AiActionButtons";
import { relativeTime } from "@/lib/engine/relative-time";
import { snapshotValue } from "@/lib/engine/store-cache";
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

const PAGE_SIZE = 50;

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
    (api) => api.sync.watchOutbox({ limit: PAGE_SIZE, offset })
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

/** Changes still waiting to upload, 50 at a time. */
export const PendingTab = ({ total }: { total: number }) => {
  const [pages, setPages] = useState(1);

  if (total === 0) {
    return (
      <EmptyOperations icon="✅">Nothing is waiting to upload.</EmptyOperations>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <OperationList>
        {Array.from({ length: pages }, (_, page) => (
          <PendingPage key={page} offset={page * PAGE_SIZE} />
        ))}
      </OperationList>
      {total > pages * PAGE_SIZE && (
        <TextActionButton
          className="self-center"
          onClick={() => setPages(pages + 1)}
        >
          Load more
        </TextActionButton>
      )}
    </div>
  );
};
