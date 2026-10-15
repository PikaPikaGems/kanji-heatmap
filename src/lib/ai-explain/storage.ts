import type { Table } from "dexie";
import type { ImagePalette, ImageStyle } from "./prompts";
import type { AiSource } from "./xai";
import { safeReadJson } from "@/lib/storage";

export const AI_SENTENCE_RESULTS_KEY = "ai-explain-sentence-results";
export const AI_GENERATED_CONTENT_EVENT = "ai-generated-content-changed";
const EPOCH_KEY = "ai-generated-content-epoch";
export type SentenceExplanation = {
  text: string;
  model: string;
  prompt: string;
  instructions: string;
  createdAt: number;
};
export type AiTextResult = {
  id: string;
  markdown: string;
  sources: AiSource[];
  model: string;
  prompt: string;
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
  resolution: "1k" | "2k";
  quality: "low" | "medium";
  model: string;
  prompt: string;
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
  textResults: Table<AiTextResult, string>;
  images: Table<MnemonicImage, string>;
  audio: Table<AiAudioRecord, string>;
};
let database: Promise<AiDatabase> | undefined;
export const getAiDatabase = () => {
  database ??= import("dexie")
    .then(({ Dexie }) => {
      const db = new Dexie("kanji-heatmap-ai") as AiDatabase;
      db.version(1).stores({
        textResults: "id",
        images: "id,kanji",
        audio: "id,sourceId",
      });
      return db;
    })
    .catch((error: unknown) => {
      database = undefined;
      throw error;
    });
  return database;
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
  if (event.key === AI_SENTENCE_RESULTS_KEY) changed();
});
const sentenceKey = (sentence: string) => sentence.normalize("NFC").trim();
const readSentences = () => {
  const value = safeReadJson<Record<string, SentenceExplanation>>(
    AI_SENTENCE_RESULTS_KEY,
    {}
  );
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
};
export const readSentenceExplanation = (
  sentence: string
): SentenceExplanation | undefined => {
  const record = readSentences()[sentenceKey(sentence)];
  if (!record || typeof record.text !== "string" || !record.text.trim())
    return undefined;
  return record;
};
export const writeSentenceExplanation = (
  sentence: string,
  record: SentenceExplanation,
  expectedEpoch = getGeneratedContentEpoch()
) => {
  checkEpoch(expectedEpoch);
  const records = readSentences();
  records[sentenceKey(sentence)] = record;
  localStorage.setItem(AI_SENTENCE_RESULTS_KEY, JSON.stringify(records));
  changed();
};
export const getTextResult = async (id: string) =>
  (await getAiDatabase()).textResults.get(id);
export const saveTextResult = async (
  result: AiTextResult,
  expectedCreatedAt?: number,
  expectedEpoch = getGeneratedContentEpoch()
) => {
  const db = await getAiDatabase();
  await db.transaction("rw", db.textResults, db.audio, async () => {
    checkEpoch(expectedEpoch);
    const old = await db.textResults.get(result.id);
    if (old?.createdAt !== expectedCreatedAt)
      throw new Error(
        "This result changed in another window. Reopen it before regenerating."
      );
    await db.textResults.put(result);
    if (old && old.fingerprint !== result.fingerprint)
      await db.audio.where("sourceId").equals(result.id).delete();
  });
  changed();
};
export const listMnemonicImages = async (kanji: string) =>
  (await getAiDatabase()).images
    .where("kanji")
    .equals(kanji)
    .sortBy("createdAt");
export const saveMnemonicImage = async (
  image: MnemonicImage,
  expectedCreatedAt?: number,
  expectedEpoch = getGeneratedContentEpoch()
) => {
  const db = await getAiDatabase();
  await db.transaction("rw", db.images, async () => {
    checkEpoch(expectedEpoch);
    const old = await db.images.get(image.id);
    if (old?.createdAt !== expectedCreatedAt)
      throw new Error(
        "This image changed in another window. Reopen it before regenerating."
      );
    if (old && old.kanji !== image.kanji)
      throw new Error("Cannot change an image's kanji.");
    if (
      !old &&
      (await db.images.where("kanji").equals(image.kanji).count()) >= 3
    )
      throw new Error(
        "Three mnemonics are already saved. Delete one before adding another."
      );
    await db.images.put(image);
  });
  changed();
};
export const deleteMnemonicImage = async (id: string) => {
  await (await getAiDatabase()).images.delete(id);
  changed();
};
export const getAudioForSource = async (
  sourceId: string,
  fingerprint: string
) => {
  const records = await (await getAiDatabase()).audio
    .where("sourceId")
    .equals(sourceId)
    .toArray();
  return records
    .filter((record) => record.fingerprint === fingerprint)
    .sort((a, b) => b.createdAt - a.createdAt)[0];
};
export const saveAudioRecord = async (
  record: AiAudioRecord,
  expectedEpoch = getGeneratedContentEpoch()
) => {
  const db = await getAiDatabase();
  await db.transaction("rw", db.audio, db.textResults, async () => {
    checkEpoch(expectedEpoch);
    const text = await db.textResults.get(record.sourceId);
    if (text && text.fingerprint !== record.fingerprint)
      throw new Error(
        "The text changed while its audio was generating. Generate audio for the current text."
      );
    await db.audio.put(record);
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
export const getGeneratedContentSize = async () => {
  const db = await getAiDatabase();
  const [texts, images, audio] = await Promise.all([
    db.textResults.toArray(),
    db.images.toArray(),
    db.audio.toArray(),
  ]);
  const metadata = JSON.stringify([
    texts,
    images.map(({ blob, ...record }) => ({ ...record, bytes: blob.size })),
    audio.map(({ blob, ...record }) => ({ ...record, bytes: blob.size })),
    readSentences(),
  ]);
  return (
    new Blob([metadata]).size +
    images.reduce((sum, record) => sum + record.blob.size, 0) +
    audio.reduce((sum, record) => sum + record.blob.size, 0)
  );
};
export const clearGeneratedContent = async () => {
  const db = await getAiDatabase();
  // Advance before clearing so in-flight paid requests cannot repopulate storage.
  localStorage.setItem(
    EPOCH_KEY,
    JSON.stringify(getGeneratedContentEpoch() + 1)
  );
  changed(true);
  await db.transaction("rw", db.textResults, db.images, db.audio, async () => {
    await db.textResults.clear();
    await db.images.clear();
    await db.audio.clear();
  });
  localStorage.removeItem(AI_SENTENCE_RESULTS_KEY);
  changed(true);
};
