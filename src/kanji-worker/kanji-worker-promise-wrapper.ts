import type {
  KanjiWorkerRequestName,
  PostMessageResponseType,
  WorkerApi,
  WorkerRequestOf,
} from "@/lib/kanji/kanji-worker-types";
import KanjiWorker from "@/kanji-worker/kanji-worker.ts?worker";

/**
 * Promise wrapper around the kanji worker.
 *
 * Two things the protocol has to account for:
 *
 * - Responses are not guaranteed to arrive in request order, so each pending
 *   promise is keyed by an incrementing request id rather than queued.
 * - A worker-level error (`onerror`, e.g. a script failure) is not tied to a
 *   single request, so it rejects every promise that is still in flight.
 */

type PendingPromise = {
  resolve: (data: unknown) => void;
  reject: (reason: string) => void;
};

const worker = new KanjiWorker();
let requestId = 0;
const pendingPromises = new Map<number, PendingPromise>();

worker.onmessage = (event: MessageEvent<PostMessageResponseType>) => {
  const { id, response } = event.data;
  const promise = pendingPromises.get(id);

  if (promise == null) {
    console.warn("promise doesn't exist for", id, response);
    return;
  }

  if (response.error) {
    console.error("worker failed", id, response.error);
    promise.reject(response.error.message);
  } else {
    promise.resolve(response.data);
  }
  pendingPromises.delete(id);
};

worker.onerror = (error) => {
  console.error("Worker failed to load", error);
  pendingPromises.forEach(({ reject }) => reject("Worker failed to load"));
  pendingPromises.clear();
};

const KANJI_WORKER_SINGLETON = {
  request<K extends KanjiWorkerRequestName>(
    data: WorkerRequestOf<K>
  ): Promise<WorkerApi[K]["response"]> {
    const id = requestId++;
    return new Promise<WorkerApi[K]["response"]>((resolve, reject) => {
      worker.postMessage({ id, data });
      pendingPromises.set(id, {
        resolve: resolve as (data: unknown) => void,
        reject,
      });
    });
  },
  terminate() {
    worker.terminate();
  },
};

export default KANJI_WORKER_SINGLETON;
