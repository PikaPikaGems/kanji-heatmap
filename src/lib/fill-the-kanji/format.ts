/** "today", "yesterday", or a short local date like "Oct 3, 2026". */
export const formatLastAttempted = (timestamp: number, now = new Date()) => {
  const date = new Date(timestamp);
  const dayStart = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((dayStart(now) - dayStart(date)) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
