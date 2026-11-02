import type { Table } from "dexie";
import type { ImagePalette, ImageStyle } from "./prompts";
import type { AiSource } from "./xai";
import { safeReadJson } from "@/lib/storage";
import { GUEST_OWNER_ID, requireOwnerId } from "@/lib/engine/content-owner";
import {
  AI_STORAGE_LIMITS,
  type AiStorageUsage,
  type KindUsage,
} from "./storage-budgets";

/** Where AI Explain answers lived before IndexedDB; moved over on first open. */
const LEGACY_SENTENCE_RESULTS_KEY = "ai-explain-sentence-results";
export const AI_GENERATED_CONTENT_EVENT = "ai-generated-content-changed";
const EPOCH_KEY = "ai-generated-content-epoch";

/**
 * Who owns it, its size, and when it was last opened or played (for
 * least-recently-used cleanup).
 */
type Tracked = { ownerId: string; bytes: number; lastUsedAt: number };

export type SentenceExplanation = {
  text: string;
  model: string;
  instructions: string;
  createdAt: number;
};
type StoredExplanation = SentenceExplanation & Tracked & { id: string };
export type AiTextResult = {
  id: string;
  markdown: string;
  sources: AiSource[];
  model: string;
  instructions: string;
  createdAt: number;
  fingerprint: string;
};
export type MnemonicImage = {
  id: string;
  kanji: string;
  blob: Blob;
  description: string;
  style: ImageStyle;
  palette: ImagePalette;
  customStyle?: string;
  customPalette?: string;
  resolution: "1k" | "2k";
  quality: "low" | "medium";
  model: string;
  instructions: string;
  createdAt: number;
};
export type AiAudioRecord = {
  id: string;
  sourceId: string;
  fingerprint: string;
  voice: string;
  language: "auto" | "ja";
  blob: Blob;
  createdAt: number;
};
type AiDatabase = import("dexie").Dexie & {
  textResults: Table<AiTextResult & Tracked, string>;
  images: Table<MnemonicImage & Tracked, string>;
  audio: Table<AiAudioRecord & Tracked, string>;
  explanations: Table<StoredExplanation, string>;
};

/** JavaScript strings take about 2 bytes per character in IndexedDB. */
const textBytes = (value: unknown) => JSON.stringify(value).length * 2;
const blobRecordBytes = ({ blob, ...rest }: { blob: Blob }) =>
  blob.size + textBytes(rest);
const tracked = <T extends object>(
  record: T,
  bytes: number,
  ownerId: string
) => ({
  ...record,
  ownerId,
  bytes,
  lastUsedAt: Date.now(),
});
/**
 * Compound index: reading its keys gives owner, last use and size for every
 * record without loading any text or blob.
 */
const USAGE_INDEX = "[ownerId+lastUsedAt+bytes]";

const sentenceKey = (sentence: string) => sentence.normalize("NFC").trim();

/**
 * Database key for one owner's copy of an item. Callers use plain ids
 * (`essay:食`); the owner is added here so two people on one device never
 * read or replace each other's content. Every exported function below reads
 * the owner once, when it is called, and uses it throughout, so a login or
 * logout halfway through can't split one save between two owners.
 */
const ownedKey = (id: string, ownerId: string) => `${ownerId}:${id}`;
/** The plain id a caller knows, from an owned database key. */
const plainId = (key: string, ownerId: string) =>
  key.startsWith(`${ownerId}:`) ? key.slice(ownerId.length + 1) : key;

/**
 * AI Explain answers used to live in localStorage. Copies them in (without
 * replacing newer ones), then frees localStorage. Runs after open, not in a
 * version upgrade, because a brand-new database skips upgrades.
 */
const moveLegacyExplanations = async (db: AiDatabase) => {
  const legacy = safeReadJson<Record<
    string,
    SentenceExplanation & { prompt?: string }
  > | null>(LEGACY_SENTENCE_RESULTS_KEY, null);
  if (legacy == null) return;
  if (typeof legacy === "object" && !Array.isArray(legacy)) {
    const records = Object.entries(legacy)
      .filter(([, record]) => typeof record?.text === "string")
      .map(([sentence, { text, model, instructions, createdAt }]) => {
        const record = { text, model, instructions, createdAt };
        // Saved before accounts existed, so these belong to the guest.
        return {
          ...record,
          id: ownedKey(sentenceKey(sentence), GUEST_OWNER_ID),
          ownerId: GUEST_OWNER_ID,
          bytes: textBytes(record),
          lastUsedAt: createdAt,
        };
      });
    await db.transaction("rw", db.explanations, async () => {
      const existing = await db.explanations.bulkGet(
        records.map(({ id }) => id)
      );
      await db.explanations.bulkPut(
        records.filter((_, index) => existing[index] === undefined)
      );
    });
  }
  // Only after the copy above has committed.
  localStorage.removeItem(LEGACY_SENTENCE_RESULTS_KEY);
};

let database: Promise<AiDatabase> | undefined;
export const getAiDatabase = () => {
  database ??= import("dexie")
    .then(async ({ Dexie }) => {
      const db = new Dexie("kanji-heatmap-ai") as AiDatabase;
      db.version(1).stores({
        textResults: "id",
        images: "id,kanji",
        audio: "id,sourceId",
      });
      db.version(2).stores({
        textResults: "id,[lastUsedAt+bytes]",
        images: "id,kanji,[lastUsedAt+bytes]",
        audio: "id,sourceId,[lastUsedAt+bytes]",
        explanations: "id,[lastUsedAt+bytes]",
      });
      // Version 3: every record gets an owner, a size and a last-used time,
      // and stops keeping the full prompt it was made with (never read, and
      // often larger than the answer).
      db.version(3)
        .stores({
          textResults: `id,${USAGE_INDEX}`,
          images: `id,kanji,${USAGE_INDEX}`,
          audio: `id,sourceId,${USAGE_INDEX}`,
          explanations: `id,${USAGE_INDEX}`,
        })
        .upgrade(async (tx) => {
          for (const name of ["textResults", "explanations"]) {
            await tx
              .table(name)
              .toCollection()
              .modify((record: Record<string, unknown> & Tracked) => {
                delete record.prompt;
                record.ownerId ??= GUEST_OWNER_ID;
                record.lastUsedAt ??= record.createdAt as number;
                record.bytes = textBytes(record);
              });
          }
          for (const name of ["images", "audio"]) {
            await tx
              .table(name)
              .toCollection()
              .modify(
                (
                  record: Record<string, unknown> & Tracked & { blob: Blob }
                ) => {
                  delete record.prompt;
                  record.ownerId ??= GUEST_OWNER_ID;
                  record.lastUsedAt ??= record.createdAt as number;
                  record.bytes = blobRecordBytes(record);
                }
              );
          }
        });
      // Version 4: keys include the owner (`guest:essay:食`), and MP3s point
      // at their text by that owned key. Primary keys can't be edited in
      // place, so each table is rewritten.
      db.version(4)
        .stores({})
        .upgrade(async (tx) => {
          for (const name of ["textResults", "explanations", "audio"]) {
            const table = tx.table(name);
            const records: (Record<string, unknown> & {
              id: string;
              ownerId?: string;
              sourceId?: string;
            })[] = await table.toArray();
            await table.clear();
            await table.bulkAdd(
              records.map((record) => {
                const ownerId = record.ownerId ?? GUEST_OWNER_ID;
                return {
                  ...record,
                  ownerId,
                  id: ownedKey(record.id, ownerId),
                  ...(record.sourceId != null && {
                    sourceId: ownedKey(record.sourceId, ownerId),
                  }),
                };
              })
            );
          }
        });
      await db.open();
      await moveLegacyExplanations(db);
      return db;
    })
    .catch((error: unknown) => {
      database = undefined;
      throw error;
    });
  return database;
};

type TrackedTable = Table<Tracked & { id: string }, string>;
const asTracked = (table: unknown) => table as TrackedTable;

/** Marks a record as used now; at most hourly, since it rewrites the record. */
const touch = (table: TrackedTable, record?: Tracked & { id: string }) => {
  if (!record || Date.now() - record.lastUsedAt < 60 * 60 * 1000) return;
  table.update(record.id, { lastUsedAt: Date.now() }).catch(() => {
    /* Only cleanup order depends on this. */
  });
};

type UsageRow = {
  id: string;
  ownerId: string;
  lastUsedAt: number;
  bytes: number;
};
const readUsageRows = async (table: TrackedTable) => {
  const rows: UsageRow[] = [];
  await table.orderBy(USAGE_INDEX).eachKey((key, cursor) => {
    const [ownerId, lastUsedAt, bytes] = key as [string, number, number];
    rows.push({ id: cursor.primaryKey as string, ownerId, lastUsedAt, bytes });
  });
  return rows;
};
const sumBytes = (rows: UsageRow[]) =>
  rows.reduce((total, row) => total + row.bytes, 0);
const splitByOwner = (rows: UsageRow[], ownerId: string): KindUsage => {
  const mine = sumBytes(rows.filter((row) => row.ownerId === ownerId));
  return { mine, others: sumBytes(rows) - mine };
};

/**
 * Deletes the least recently used rows, from any owner (all of these can be
 * remade), until `overBy` bytes are freed. `keepId` is the one just saved.
 */
const deleteLeastRecentlyUsed = async (
  table: TrackedTable,
  rows: UsageRow[],
  overBy: number,
  keepId: string
) => {
  if (overBy <= 0) return;
  const doomed: string[] = [];
  for (const row of [...rows].sort((a, b) => a.lastUsedAt - b.lastUsedAt)) {
    if (overBy <= 0) break;
    if (row.id === keepId) continue;
    doomed.push(row.id);
    overBy -= row.bytes;
  }
  await table.bulkDelete(doomed);
};

/** Keeps all text under its limit by removing the oldest AI Explain answers. */
const fitTextLimit = async (db: AiDatabase, keepId: string) => {
  const explanations = asTracked(db.explanations);
  const [essays, answers] = await Promise.all([
    readUsageRows(asTracked(db.textResults)),
    readUsageRows(explanations),
  ]);
  await deleteLeastRecentlyUsed(
    explanations,
    answers,
    sumBytes(essays) + sumBytes(answers) - AI_STORAGE_LIMITS.text,
    keepId
  );
};

export const getAiStorageUsage = async (): Promise<AiStorageUsage> => {
  const ownerId = requireOwnerId();
  const db = await getAiDatabase();
  const [essays, answers, audio, images] = await Promise.all(
    [db.textResults, db.explanations, db.audio, db.images].map((table) =>
      readUsageRows(asTracked(table))
    )
  );
  return {
    text: splitByOwner([...essays, ...answers], ownerId),
    audio: splitByOwner(audio, ownerId),
    images: splitByOwner(images, ownerId),
  };
};

const FULL_MESSAGES = {
  text: `Saved AI text has reached its ${AI_STORAGE_LIMITS.text / 1024 / 1024} MB limit on this device. Download what you want to keep, then delete older essays or vocabulary details.`,
  images: `Saved images have reached their ${AI_STORAGE_LIMITS.images / 1024 / 1024} MB limit on this device. Download what you want to keep, then delete older mnemonics.`,
};
/**
 * Call before generating a new essay, vocabulary details or image. Only what
 * can't be remade counts: AI Explain answers make room by themselves.
 */
export const assertStorageAvailable = async (kind: "text" | "images") => {
  const db = await getAiDatabase();
  const table = kind === "text" ? db.textResults : db.images;
  const used = sumBytes(await readUsageRows(asTracked(table)));
  if (used >= AI_STORAGE_LIMITS[kind]) throw new Error(FULL_MESSAGES[kind]);
};

export const getGeneratedContentEpoch = () =>
  safeReadJson<number>(EPOCH_KEY, 0);
const checkEpoch = (expected: number) => {
  if (expected !== getGeneratedContentEpoch())
    throw new Error(
      "Generated content was cleared. Generate again to save a new result."
    );
};
const changed = (cleared = false) =>
  window.dispatchEvent(
    new CustomEvent(AI_GENERATED_CONTENT_EVENT, { detail: { cleared } })
  );
// Module setup keeps clears coordinated across tabs without a React subscription.
window.addEventListener("storage", (event) => {
  if (event.key === EPOCH_KEY || event.key === null) changed(true);
});
export const readSentenceExplanation = async (
  sentence: string
): Promise<SentenceExplanation | undefined> => {
  const ownerId = requireOwnerId();
  const db = await getAiDatabase();
  const record = await db.explanations.get(
    ownedKey(sentenceKey(sentence), ownerId)
  );
  if (!record || typeof record.text !== "string" || !record.text.trim())
    return undefined;
  touch(asTracked(db.explanations), record);
  return record;
};
export const writeSentenceExplanation = async (
  sentence: string,
  record: SentenceExplanation,
  expectedEpoch = getGeneratedContentEpoch()
) => {
  const ownerId = requireOwnerId();
  const db = await getAiDatabase();
  const id = ownedKey(sentenceKey(sentence), ownerId);
  await db.transaction("rw", db.explanations, db.textResults, async () => {
    checkEpoch(expectedEpoch);
    await db.explanations.put(
      tracked({ ...record, id }, textBytes(record), ownerId)
    );
    await fitTextLimit(db, id);
  });
  changed();
};
export const deleteSentenceExplanation = async (sentence: string) => {
  const ownerId = requireOwnerId();
  await (
    await getAiDatabase()
  ).explanations.delete(ownedKey(sentenceKey(sentence), ownerId));
  changed();
};
export const getTextResult = async (
  id: string
): Promise<AiTextResult | undefined> => {
  const ownerId = requireOwnerId();
  const db = await getAiDatabase();
  const record = await db.textResults.get(ownedKey(id, ownerId));
  touch(asTracked(db.textResults), record);
  return record && { ...record, id };
};
export const saveTextResult = async (
  result: AiTextResult,
  expectedCreatedAt?: number,
  expectedEpoch = getGeneratedContentEpoch()
) => {
  const ownerId = requireOwnerId();
  const db = await getAiDatabase();
  await db.transaction(
    "rw",
    [db.textResults, db.audio, db.explanations],
    async () => {
      checkEpoch(expectedEpoch);
      const key = ownedKey(result.id, ownerId);
      const old = await db.textResults.get(key);
      if (old?.createdAt !== expectedCreatedAt)
        throw new Error(
          "This result changed in another window. Reopen it before regenerating."
        );
      await db.textResults.put(
        tracked({ ...result, id: key }, textBytes(result), ownerId)
      );
      if (old && old.fingerprint !== result.fingerprint)
        await db.audio.where("sourceId").equals(key).delete();
      await fitTextLimit(db, key);
    }
  );
  changed();
};
/** Deletes an essay or vocabulary details with its narration. */
export const deleteTextResult = async (id: string) => {
  const ownerId = requireOwnerId();
  const db = await getAiDatabase();
  const key = ownedKey(id, ownerId);
  await db.transaction("rw", db.textResults, db.audio, async () => {
    await db.textResults.delete(key);
    await db.audio.where("sourceId").equals(key).delete();
  });
  changed();
};
export const listMnemonicImages = async (
  kanji: string
): Promise<MnemonicImage[]> => {
  const ownerId = requireOwnerId();
  const db = await getAiDatabase();
  const images = await db.images
    .where("kanji")
    .equals(kanji)
    .filter((image) => image.ownerId === ownerId)
    .sortBy("createdAt");
  images.forEach((image) => touch(asTracked(db.images), image));
  return images;
};
export const saveMnemonicImage = async (
  image: MnemonicImage,
  expectedCreatedAt?: number,
  expectedEpoch = getGeneratedContentEpoch()
) => {
  const ownerId = requireOwnerId();
  const db = await getAiDatabase();
  await db.transaction("rw", db.images, async () => {
    checkEpoch(expectedEpoch);
    const old = await db.images.get(image.id);
    if (old?.createdAt !== expectedCreatedAt)
      throw new Error(
        "This image changed in another window. Reopen it before regenerating."
      );
    if (old && (old.kanji !== image.kanji || old.ownerId !== ownerId))
      throw new Error("Cannot change this image.");
    if (
      !old &&
      (await db.images
        .where("kanji")
        .equals(image.kanji)
        .filter((saved) => saved.ownerId === ownerId)
        .count()) >= 3
    )
      throw new Error(
        "Three mnemonics are already saved. Delete one before adding another."
      );
    await db.images.put(tracked(image, blobRecordBytes(image), ownerId));
  });
  changed();
};
export const deleteMnemonicImage = async (id: string) => {
  const ownerId = requireOwnerId();
  const db = await getAiDatabase();
  await db.transaction("rw", db.images, async () => {
    const image = await db.images.get(id);
    if (image?.ownerId === ownerId) await db.images.delete(id);
  });
  changed();
};
export const getAudioForSource = async (
  sourceId: string,
  fingerprint: string
) => {
  const ownerId = requireOwnerId();
  const db = await getAiDatabase();
  const records = await db.audio
    .where("sourceId")
    .equals(ownedKey(sourceId, ownerId))
    .toArray();
  const record: (AiAudioRecord & Tracked) | undefined = records
    .filter((record) => record.fingerprint === fingerprint)
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  touch(asTracked(db.audio), record);
  return (
    record && {
      ...record,
      id: plainId(record.id, record.ownerId),
      sourceId,
    }
  );
};
export const saveAudioRecord = async (
  record: AiAudioRecord,
  expectedEpoch = getGeneratedContentEpoch()
) => {
  const ownerId = requireOwnerId();
  const db = await getAiDatabase();
  await db.transaction("rw", db.audio, db.textResults, async () => {
    checkEpoch(expectedEpoch);
    const key = ownedKey(record.id, ownerId);
    const sourceKey = ownedKey(record.sourceId, ownerId);
    const text = await db.textResults.get(sourceKey);
    if (text && text.fingerprint !== record.fingerprint)
      throw new Error(
        "The text changed while its audio was generating. Generate audio for the current text."
      );
    await db.audio.put(
      tracked(
        { ...record, id: key, sourceId: sourceKey },
        blobRecordBytes(record),
        ownerId
      )
    );
    const audio = asTracked(db.audio);
    const rows = await readUsageRows(audio);
    await deleteLeastRecentlyUsed(
      audio,
      rows,
      sumBytes(rows) - AI_STORAGE_LIMITS.audio,
      key
    );
  });
  changed();
};
export const contentFingerprint = async (text: string) => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
};
/** Deletes everything the current owner generated on this device. */
export const clearGeneratedContent = async () => {
  const ownerId = requireOwnerId();
  const db = await getAiDatabase();
  // Advance before clearing so in-flight paid requests cannot repopulate storage.
  localStorage.setItem(
    EPOCH_KEY,
    JSON.stringify(getGeneratedContentEpoch() + 1)
  );
  changed(true);
  const tables = [db.textResults, db.images, db.audio, db.explanations];
  await db.transaction("rw", tables, async () => {
    for (const table of tables) {
      // Every key of this owner, read from the index without loading records.
      await asTracked(table)
        .where(USAGE_INDEX)
        .between([ownerId, -Infinity, -Infinity], [ownerId, Infinity, Infinity])
        .delete();
    }
  });
  changed(true);
};
