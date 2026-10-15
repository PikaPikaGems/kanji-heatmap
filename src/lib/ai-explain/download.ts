export const safeFilename = (name: string) =>
  Array.from(name, (character) =>
    character.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(character)
      ? "-"
      : character
  )
    .join("")
    .slice(0, 180);
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = safeFilename(filename);
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    // Downloads may consume the URL asynchronously, especially in Safari.
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
};
