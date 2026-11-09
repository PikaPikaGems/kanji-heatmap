import { useSyncExternalStore } from "react";
import {
  accountHasNoPremium,
  finishLoginDownload,
  retryDataDownload,
} from "./data-download";
import { copyForDownloadError } from "./engine-copy";
import { openWriteBlockedDialog } from "./write-blocked-dialog";

/**
 * The app-wide "download your data" dialog, mounted once in App. Every
 * "Download now" opens it on "downloading"; the login flow opens it on
 * "failed" when the download right after logging in fails. It opens on top
 * of whatever is open (drawer, settings), so closing it puts you back there.
 */
export type DataDownloadStatus =
  | { kind: "downloading" }
  /** `message` says why; `code` goes in the copyable report. */
  | { kind: "failed"; code: string; message: string }
  | { kind: "downloaded" };

type DataDownloadDialogState = {
  open: boolean;
  /** Counts the openings, so each starts fresh. */
  session: number;
  status: DataDownloadStatus;
  /** Opened by the login flow: a download that works restarts the app. */
  afterLogin: boolean;
};

let state: DataDownloadDialogState = {
  open: false,
  session: 0,
  status: { kind: "downloading" },
  afterLogin: false,
};
// Bumped by every run and by closing, so a download that finishes after the
// dialog was closed (or retried) doesn't change it.
let runId = 0;
const listeners = new Set<() => void>();

const setState = (next: DataDownloadDialogState) => {
  state = next;
  for (const listener of listeners) listener();
};

export const closeDataDownloadDialog = () => {
  runId++;
  setState({ ...state, open: false });
};

/**
 * Opens the dialog (if closed) on "downloading" and downloads the account's
 * data: "Download now" everywhere, and the dialog's Try again. A download
 * that works ends on "downloaded", or on "Why can't my account save?" when
 * the account has no premium. After login it restarts the app instead
 * (`resetApp`), as the login flow does.
 */
export const downloadNow = async (resetApp?: () => void) => {
  const id = ++runId;
  const afterLogin = state.open && state.afterLogin;
  setState({
    open: true,
    session: state.open ? state.session : state.session + 1,
    status: { kind: "downloading" },
    afterLogin,
  });

  const code = await retryDataDownload();
  if (id !== runId) return;
  if (code !== null) {
    setState({
      ...state,
      status: { kind: "failed", code, message: copyForDownloadError(code) },
    });
    return;
  }
  if (afterLogin && resetApp) {
    closeDataDownloadDialog();
    void finishLoginDownload(resetApp);
    return;
  }
  const noPremium = await accountHasNoPremium();
  if (id !== runId) return;
  if (noPremium) {
    closeDataDownloadDialog();
    openWriteBlockedDialog();
    return;
  }
  setState({ ...state, status: { kind: "downloaded" } });
};

/** The login flow's download failed (`code`): open on "failed". */
export const openLoginDownloadFailed = (code: string) => {
  runId++;
  setState({
    open: true,
    session: state.session + 1,
    status: { kind: "failed", code, message: copyForDownloadError(code) },
    afterLogin: true,
  });
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useDataDownloadDialog = () =>
  useSyncExternalStore(subscribe, () => state);
