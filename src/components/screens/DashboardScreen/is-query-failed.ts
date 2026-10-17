import type { EngineQuerySnapshot } from "@/lib/engine/use-engine-query";

/** True when an engine read failed or came back as an error result. */
export const isQueryFailed = (snapshot: EngineQuerySnapshot<unknown>) =>
  snapshot.status === "failed" ||
  (snapshot.status === "ready" && !snapshot.result.ok);
