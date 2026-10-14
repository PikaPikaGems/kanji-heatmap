import { useState } from "react";
import type { SyncOperation } from "engine-contract";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/engine/relative-time";
import { snapshotValue } from "@/lib/engine/store-cache";
import { useEngineQuery } from "@/lib/engine/use-engine-query";
import {
  describeOperation,
  operationIcon,
  operationKanji,
} from "./operation-info";

const PAGE_SIZE = 50;

const PendingRow = ({ op }: { op: SyncOperation }) => {
  const Icon = operationIcon(op.type);
  const kanji = operationKanji(op);
  const queuedAt = Date.parse(op.clientUpdatedAt);

  return (
    <li className="flex items-center gap-3 p-2.5 border rounded-lg">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="flex-1 min-w-0 text-sm font-medium">
        {describeOperation(op)}
      </span>
      {kanji !== undefined && (
        <span className="text-xl leading-none">{kanji}</span>
      )}
      {!Number.isNaN(queuedAt) && (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {relativeTime(queuedAt)}
        </span>
      )}
    </li>
  );
};

const PendingMessage = ({ children }: { children: string }) => (
  <li className="px-1 py-2 text-sm text-muted-foreground">{children}</li>
);

/** One page of the outbox; each page is its own cached store. */
const PendingPage = ({ offset }: { offset: number }) => {
  const snapshot = useEngineQuery(
    `sync.watchOutbox:${PAGE_SIZE}:${offset}`,
    (api) => api.sync.watchOutbox({ limit: PAGE_SIZE, offset })
  );

  if (snapshot.status === "loading") {
    return <PendingMessage>Loading…</PendingMessage>;
  }
  const outbox = snapshotValue(snapshot);
  if (!outbox) {
    return <PendingMessage>Couldn&apos;t load pending changes.</PendingMessage>;
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
      <p className="px-1 py-4 text-sm text-muted-foreground">
        Nothing is waiting to upload.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {Array.from({ length: pages }, (_, page) => (
          <PendingPage key={page} offset={page * PAGE_SIZE} />
        ))}
      </ul>
      {total > pages * PAGE_SIZE && (
        <Button
          variant="outline"
          size="sm"
          className="self-center"
          onClick={() => setPages(pages + 1)}
        >
          Load more
        </Button>
      )}
    </div>
  );
};
