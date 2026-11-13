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

/**
 * Bytes of one kind: the current user's, everyone else's on this device, and
 * what everyone shares (AI Explain answers; 0 for the other kinds).
 */
export type KindUsage = { mine: number; others: number; shared: number };
export type AiStorageUsage = Record<AiStorageKind, KindUsage>;

export const kindTotal = ({ mine, others, shared }: KindUsage) =>
  mine + others + shared;

/**
 * What the current owner may delete in AI Study Tools → Usage: a guest only
 * their own and the shared explains, a signed-in user everything.
 */
export const deletableBytes = (usage: AiStorageUsage, isGuest: boolean) =>
  Object.values(usage).reduce(
    (sum, kind) => sum + (isGuest ? kind.mine + kind.shared : kindTotal(kind)),
    0
  );

/**
 * Added to the "limit reached" messages when other people's essays or images
 * take most of the space, so the reader knows it isn't theirs to free alone:
 * a signed-in user can delete it, a guest needs someone logged in.
 */
export const FREE_SPACE_NOTES = {
  signedIn: "You can free space in AI Study Tools → Usage.",
  guest:
    "Mostly from other people using this device. Someone logged in can free space in AI Study Tools → Usage.",
};
/** Follows the guest note; a link to Discord where it can be one. */
export const ASK_ON_DISCORD = "Need help? Ask us on Discord.";

/**
 * Which free-space note applies, if others take most of this kind (shared
 * explains don't count: they make room by themselves).
 */
export const freeSpaceNote = (
  { mine, others }: Pick<KindUsage, "mine" | "others">,
  isGuest: boolean
): keyof typeof FREE_SPACE_NOTES | null => {
  if (others <= mine) return null;
  return isGuest ? "guest" : "signedIn";
};
