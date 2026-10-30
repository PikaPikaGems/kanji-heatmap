/** "just now", "5 min ago", "3 h ago", "2 d ago" for a past unix-ms time. */
export const relativeTime = (at: number) => {
  const minutes = Math.floor(Math.max(0, Date.now() - at) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};
