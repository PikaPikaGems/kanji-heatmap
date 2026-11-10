import {
  AiVoiceUnavailableError,
  arrayOf,
  asRecord,
  numberOf,
  readErrorBody,
  splitForSpeech,
} from "./shared";
import {
  AiKeyRejectedError,
  type AiProviderClient,
  type SpeechRequest,
} from "./types";

/** ElevenLabs speech. Its API allows browser calls. */
const BASE_URL = "https://api.elevenlabs.io/v1";

const PERMISSIONS = "Text to Speech, Voices: Read and User: Read";

const authHeaders = (apiKey: string) => ({ "xi-api-key": apiKey });

const responseError = async (res: Response): Promise<Error> => {
  const { message, code } = await readErrorBody(res);
  if (code === "missing_permissions")
    return new Error(
      `ElevenLabs: this key is missing a permission. It needs ${PERMISSIONS}.`
    );
  if (res.status === 401)
    return new AiKeyRejectedError("elevenlabs", "ElevenLabs");
  if (
    code === "voice_not_found" ||
    (res.status === 404 && /voice/i.test(message))
  )
    return new AiVoiceUnavailableError(
      "Your ElevenLabs voice is no longer available."
    );
  if (code === "quota_exceeded" || res.status === 402)
    return new Error(
      "ElevenLabs: not enough credits left for this text. Check your plan at elevenlabs.io."
    );
  if (res.status === 429)
    return new Error(
      "ElevenLabs: too many requests at once. Try again in a moment."
    );
  return new Error(
    message
      ? `ElevenLabs: ${message}`
      : `ElevenLabs request failed (${res.status}).`
  );
};

/** The output formats closest to each offered bit rate. */
const OUTPUT_FORMATS: Record<number, string> = {
  32000: "mp3_22050_32",
  64000: "mp3_44100_64",
  96000: "mp3_44100_96",
  128000: "mp3_44100_128",
};

/** The longest text each model takes in one request (v3: 5,000). */
const MAX_CHARACTERS: Record<string, number> = {
  eleven_v3: 4800,
  eleven_flash_v2_5: 39000,
};

/** A Japanese voice from the Voice Library. */
export type ElevenLabsVoice = {
  id: string;
  name: string;
  /** e.g. "female · young · narrative" */
  details: string;
  previewUrl?: string;
};

/**
 * One page of Japanese voices from the Voice Library. Speech works with a
 * library voice without adding it to the account (Voices: Read is enough).
 */
export const listJapaneseVoices = async (
  apiKey: string,
  page: number
): Promise<{ voices: ElevenLabsVoice[]; hasMore: boolean }> => {
  const res = await fetch(
    `${BASE_URL}/shared-voices?language=ja&page_size=50&page=${page}`,
    { headers: authHeaders(apiKey) }
  );
  if (!res.ok) throw await responseError(res);
  const body = asRecord(await res.json());
  const voices = arrayOf(body.voices)
    .map(asRecord)
    .filter((voice) => typeof voice.voice_id === "string")
    .map((voice) => ({
      id: String(voice.voice_id),
      name: typeof voice.name === "string" ? voice.name.trim() : "Voice",
      details: [voice.gender, voice.age, voice.use_case]
        .filter((part) => typeof part === "string" && part)
        .join(" · ")
        .replace(/_/g, " "),
      previewUrl:
        typeof voice.preview_url === "string" ? voice.preview_url : undefined,
    }));
  return { voices, hasMore: body.has_more === true };
};

/** Credits used and left this billing period. */
export type ElevenLabsBalance = {
  used: number;
  limit: number;
  /** When the credits reset, if ElevenLabs said. */
  resetsAt?: Date;
};

export const readElevenLabsBalance = async (
  apiKey: string
): Promise<ElevenLabsBalance> => {
  const res = await fetch(`${BASE_URL}/user/subscription`, {
    headers: authHeaders(apiKey),
  });
  if (!res.ok) throw await responseError(res);
  const body = asRecord(await res.json());
  const reset = numberOf(body.next_character_count_reset_unix);
  return {
    used: numberOf(body.character_count) ?? 0,
    limit: numberOf(body.character_limit) ?? 0,
    resetsAt: reset ? new Date(reset * 1000) : undefined,
  };
};

const speakPiece = async (
  { apiKey, model, voice, bitRate, signal }: SpeechRequest,
  text: string
) => {
  const format = OUTPUT_FORMATS[bitRate] ?? OUTPUT_FORMATS[64000];
  const res = await fetch(
    `${BASE_URL}/text-to-speech/${encodeURIComponent(voice)}?output_format=${format}`,
    {
      method: "POST",
      headers: { ...authHeaders(apiKey), "Content-Type": "application/json" },
      // Japanese words in the text are read in Japanese, not Chinese.
      body: JSON.stringify({ text, model_id: model, language_code: "ja" }),
      signal,
    }
  );
  if (!res.ok) throw await responseError(res);
  const credits = Number(res.headers.get("character-cost"));
  return {
    blob: await res.blob(),
    credits: Number.isFinite(credits) ? credits : 0,
  };
};

export const elevenlabsClient: AiProviderClient = {
  checkKey: async (apiKey) => {
    try {
      await readElevenLabsBalance(apiKey);
      return "valid";
    } catch (error) {
      if (error instanceof AiKeyRejectedError) return "rejected";
      throw error;
    }
  },
  generateSpeech: async (request) => {
    if (!request.text.trim())
      throw new Error("There is no text to read aloud.");
    if (!request.voice) throw new AiVoiceUnavailableError("No voice picked.");
    const pieces = splitForSpeech(
      request.text,
      MAX_CHARACTERS[request.model] ?? MAX_CHARACTERS.eleven_v3
    );
    const blobs: Blob[] = [];
    let credits = 0;
    // One at a time: the free plan allows few requests at once.
    for (const piece of pieces) {
      const spoken = await speakPiece(request, piece);
      blobs.push(spoken.blob);
      credits += spoken.credits;
    }
    const blob = new Blob(blobs, { type: "audio/mpeg" });
    if (!blob.size) throw new Error("No audio was returned. Try again.");
    return {
      blob,
      usage: {
        provider: "elevenlabs",
        characters: request.text.length,
        credits: credits || undefined,
      },
    };
  },
  defaultVoice: async (apiKey) => {
    const [first] = (await listJapaneseVoices(apiKey, 0)).voices;
    if (!first) throw new Error("ElevenLabs has no Japanese voices to use.");
    return { id: first.id, name: first.name };
  },
};
