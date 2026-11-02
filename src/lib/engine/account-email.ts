import { useStorageValue } from "@/hooks/use-storage-value";
import { notifyStorage } from "@/lib/storage";

/**
 * Preference: the email last used to log in. `auth.me()` doesn't return it, so
 * the sidebar account row shows this (falling back to the user id).
 */
const ACCOUNT_EMAIL_KEY = "kh-account-email";

const readAccountEmail = (): string | null => {
  try {
    return localStorage.getItem(ACCOUNT_EMAIL_KEY);
  } catch {
    return null;
  }
};

export const rememberAccountEmail = (email: string) => {
  try {
    localStorage.setItem(ACCOUNT_EMAIL_KEY, email);
  } catch {
    // Storage can be unavailable (private mode); the row falls back to userId.
  }
  notifyStorage(ACCOUNT_EMAIL_KEY);
};

export const useAccountEmail = () =>
  useStorageValue(readAccountEmail, (key) => key === ACCOUNT_EMAIL_KEY);
