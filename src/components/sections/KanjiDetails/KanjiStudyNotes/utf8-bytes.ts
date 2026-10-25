const encoder = new TextEncoder();

/** The size the engine limits notes by (`notes.notesMaxUtf8Bytes`). */
export const utf8ByteLength = (text: string) => encoder.encode(text).length;
