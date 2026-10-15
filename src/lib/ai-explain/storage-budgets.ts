const MB = 1024 * 1024;

/** The three storage bars: text answers, narration, and images. */
export type AiStorageKind = "text" | "audio" | "images";

/**
 * Per-device limits, far below what browsers allow, so AI content can't
 * crowd out the app.
 * - text: AI Explain answers, kanji essays, anchor word essays.
 * - audio: narration MP3s.
 * - images: Visual Mnemonics.
 * MP3s and AI Explain answers can be remade, so the least recently used are
 * removed to stay under the limit. Essays and images are never removed for
 * you: generating new ones stops at the limit instead.
 */
export const AI_STORAGE_LIMITS: Record<AiStorageKind, number> = {
  text: 40 * MB,
  audio: 35 * MB,
  images: 75 * MB,
};

/** The near-limit notice shows from this share of a limit. */
export const STORAGE_WARNING_RATIO = 0.7;

/** Until accounts exist, everything on this device belongs to the guest. */
export const CURRENT_OWNER_ID = "guest";

/** Bytes of one kind: the current user's, and everyone else's on this device. */
export type KindUsage = { mine: number; others: number };
export type AiStorageUsage = Record<AiStorageKind, KindUsage>;

export const kindTotal = ({ mine, others }: KindUsage) => mine + others;
