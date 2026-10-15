const MB = 1024 * 1024;

/** "3.4 MB" under 10 MB, "120 MB" above. */
export const formatMegabytes = (bytes: number) =>
  `${(bytes / MB).toFixed(bytes < 10 * MB ? 1 : 0)} MB`;
