/**
 * Encodes raw 16-bit mono PCM (Gemini speech) as MP3, so a recording takes
 * about a fifth of the space. The encoder loads only when first needed.
 */
export const pcmToMp3 = async (
  pcm: Uint8Array,
  sampleRate: number,
  bitRate: number
): Promise<Blob> => {
  const { Mp3Encoder } = await import("@breezystack/lamejs");
  // Copy into a fresh buffer: Int16Array needs 2-byte alignment.
  const samples = new Int16Array(
    pcm.slice(0, pcm.length - (pcm.length % 2)).buffer
  );
  const encoder = new Mp3Encoder(1, sampleRate, Math.round(bitRate / 1000));
  const chunks: Uint8Array[] = [];
  const BLOCK = 1152 * 10;
  for (let start = 0; start < samples.length; start += BLOCK) {
    const encoded = encoder.encodeBuffer(
      samples.subarray(start, start + BLOCK)
    );
    if (encoded.length) chunks.push(new Uint8Array(encoded));
  }
  const end = encoder.flush();
  if (end.length) chunks.push(new Uint8Array(end));
  return new Blob(chunks, { type: "audio/mpeg" });
};
