/**
 * What "Delete saved AI content" (AI Study Tools → Usage) can delete, how big
 * each choice is, and the phrase that confirms it. No storage access here, so
 * the dialog can use it without loading the database code.
 */

/**
 * Whose content. A guest can only pick "mine" (the guest's own); a signed-in
 * user can pick any. "others" is every other account, not the guest.
 */
export type AiContentWhose = "mine" | "guest" | "others" | "everyone";
export const AI_CONTENT_WHOSE_ORDER: readonly AiContentWhose[] = [
  "mine",
  "guest",
  "others",
  "everyone",
];

/**
 * Kinds of content per owner. "essays" is kanji essays and vocabulary
 * details, with their read-aloud audio; "audio" is every MP3.
 */
export type AiContentKind = "essays" | "audio" | "images";
export const AI_CONTENT_KIND_ORDER: readonly AiContentKind[] = [
  "essays",
  "audio",
  "images",
];

/** Bytes of one owner group. `essayAudio` is the part of `audio` that reads essays. */
export type AiContentGroupSizes = {
  essays: number;
  essayAudio: number;
  audio: number;
  images: number;
};

/** What the current owner may delete, with sizes, read when the dialog opens. */
export type DeletableAiContent = {
  groups: Partial<Record<AiContentWhose, AiContentGroupSizes>>;
  /** Every AI Explain answer on this device; anyone may delete them. */
  sharedExplains: number;
};

export type AiContentDeletion = {
  whose: AiContentWhose | null;
  kinds: readonly AiContentKind[];
  sharedExplains: boolean;
};

/** Bytes one checkbox stands for: essays include the audio that reads them. */
export const kindBytes = (sizes: AiContentGroupSizes, kind: AiContentKind) => {
  if (kind === "essays") return sizes.essays + sizes.essayAudio;
  return sizes[kind];
};

/** Kinds this group has something of: the only checkboxes shown. */
export const availableKinds = (sizes: AiContentGroupSizes | undefined) =>
  AI_CONTENT_KIND_ORDER.filter(
    (kind) => sizes !== undefined && kindBytes(sizes, kind) > 0
  );

/** Everything in one group (essays' audio is part of `audio`). */
export const groupTotal = (sizes: AiContentGroupSizes) =>
  sizes.essays + sizes.audio + sizes.images;

/** Groups with anything in them: the only "whose" choices shown. */
export const availableWhose = (content: DeletableAiContent) =>
  AI_CONTENT_WHOSE_ORDER.filter((whose) => {
    const sizes = content.groups[whose];
    return sizes !== undefined && groupTotal(sizes) > 0;
  });

/** Bytes a deletion frees; essays' audio counts once when audio is also picked. */
export const deletionBytes = (
  content: DeletableAiContent,
  { whose, kinds, sharedExplains }: AiContentDeletion
) => {
  const sizes = whose === null ? undefined : content.groups[whose];
  let bytes = sharedExplains ? content.sharedExplains : 0;
  if (!sizes) return bytes;
  if (kinds.includes("essays")) bytes += sizes.essays;
  if (kinds.includes("audio")) bytes += sizes.audio;
  else if (kinds.includes("essays")) bytes += sizes.essayAudio;
  if (kinds.includes("images")) bytes += sizes.images;
  return bytes;
};

/** Whether this deletion includes the current owner's own content. */
export const includesMine = ({ whose, kinds }: AiContentDeletion) =>
  kinds.length > 0 && (whose === "mine" || whose === "everyone");

/** Whether this deletion includes anyone else's own content. */
export const includesOthers = ({ whose, kinds }: AiContentDeletion) =>
  kinds.length > 0 && whose !== null && whose !== "mine";

const KIND_WORDS: Record<AiContentKind, string> = {
  essays: "essays",
  audio: "audio",
  images: "images",
};

/** "essays", "essays and images", "essays, audio and images". */
const listWords = (words: readonly string[]) =>
  words.length < 2
    ? words.join("")
    : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;

/** The part of the phrase naming whose content and which kinds. */
const ownedPhrase = (
  whose: AiContentWhose,
  kinds: readonly AiContentKind[],
  all: boolean
) => {
  const list = listWords(kinds.map((kind) => KIND_WORDS[kind]));
  if (whose === "mine") return all ? "all my content" : `my ${list}`;
  if (whose === "guest") return all ? "all guest content" : `guest ${list}`;
  if (whose === "others")
    return all
      ? "all content from other accounts"
      : `${list} from other accounts`;
  return all ? "all content from everyone" : `${list} from everyone`;
};

/**
 * What the person must type, exactly, to delete. It names whose content and
 * which kinds, so typing it shows they read the choice. No apostrophes:
 * phones turn ' into ’. Empty when nothing is picked.
 */
export const confirmPhrase = (
  content: DeletableAiContent,
  deletion: AiContentDeletion
) => {
  const { whose, sharedExplains } = deletion;
  const sizes = whose === null ? undefined : content.groups[whose];
  // In the order shown, whatever order they were ticked in.
  const kinds = AI_CONTENT_KIND_ORDER.filter((kind) =>
    deletion.kinds.includes(kind)
  );
  const all =
    sizes !== undefined &&
    kinds.length > 0 &&
    kinds.length === availableKinds(sizes).length;
  if (whose === "everyone" && all && sharedExplains) return "delete everything";
  const owned =
    whose !== null && kinds.length > 0 ? ownedPhrase(whose, kinds, all) : "";
  if (!sharedExplains) return owned ? `delete ${owned}` : "";
  return owned
    ? `delete ${owned} and all shared explains`
    : "delete all shared explains";
};
