/** Shared skip/forgot command helpers for practice typing inputs. */

export const FORGOT_COMMANDS = ["forgot", "skip"] as const;

export const isForgotCommand = (value: string): boolean => {
  const normalized = value.replace(/\s+/g, "").toLowerCase();
  return (FORGOT_COMMANDS as readonly string[]).includes(normalized);
};

/** True while the user is typing a latin forgot/skip command (keep as ASCII). */
export const isForgotCommandPrefix = (value: string): boolean => {
  const stripped = value.replace(/\s+/g, "");
  if (!stripped || !/^[a-zA-Z]+$/.test(stripped)) return false;
  const lower = stripped.toLowerCase();
  return FORGOT_COMMANDS.some((cmd) => cmd.startsWith(lower));
};
