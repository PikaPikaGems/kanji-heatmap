/**
 * The last few correct-answer chimes and how each went, for App & Device
 * Info. Written by `correct-chime.ts`; kept apart from it so reading the log
 * doesn't load the chime's audio.
 */
const LOG_SIZE = 12;

export type ChimeOutcome =
  | { kind: "pending" }
  | { kind: "played" }
  | { kind: "blocked"; error: string }
  | { kind: "cut-off"; atMs: number }
  | { kind: "never-started" };

export type ChimeLogEntry = {
  at: Date;
  /** What was speaking when the chime started. */
  speech: "none" | "browser voice" | "AI voice";
  /** Which pool element played it; "retry" for the fresh one after a failure. */
  slot: number | "retry";
  outcome: ChimeOutcome;
  /** `navigator.audioSession.type`, where the browser has it. */
  audioSession?: string;
};

const log: ChimeLogEntry[] = [];
let total = 0;

/** Adds a chime, newest first; its `outcome` is updated in place as it plays. */
export const addChimeLogEntry = (entry: ChimeLogEntry) => {
  total++;
  log.unshift(entry);
  log.length = Math.min(log.length, LOG_SIZE);
};

const pad = (n: number) => String(n).padStart(2, "0");

const describeOutcome = (outcome: ChimeOutcome) => {
  if (outcome.kind === "pending") return "playing…";
  if (outcome.kind === "played") return "played";
  if (outcome.kind === "blocked") return `blocked (${outcome.error})`;
  if (outcome.kind === "cut-off") return `cut off at ${outcome.atMs} ms`;
  return "never started";
};

/** One log line: "18:02:41 · played · slot 1 · speech: none · session auto". */
export const describeChime = (entry: ChimeLogEntry) =>
  [
    `${pad(entry.at.getHours())}:${pad(entry.at.getMinutes())}:${pad(entry.at.getSeconds())}`,
    describeOutcome(entry.outcome),
    entry.slot === "retry" ? "retry" : `slot ${entry.slot + 1}`,
    `speech: ${entry.speech}`,
    ...(entry.audioSession ? [`session ${entry.audioSession}`] : []),
  ].join(" · ");

/** The last chimes, newest first, and how many have played since the page loaded. */
export const getChimeLog = () => ({ entries: [...log], total });

/** The log as App & Device Info's copied report shows it. */
export const formatChimeLogForClipboard = () => {
  const lines = ["", `Correct chime (${total} since the page loaded)`];
  if (log.length === 0) lines.push("No chimes yet.");
  for (const entry of log) lines.push(describeChime(entry));
  return lines;
};
