import type { ReactNode } from "react";
import { ErrorTerminal } from "@/components/common/ErrorTerminal";
import { useRecentFailedOperations } from "@/components/dependent/sync-operations/use-recent-failed-operations";
import { formatCaptureTimestamp } from "@/hooks/use-debug-info";
import { useDebugReport } from "@/hooks/use-debug-report";
import { useAccountEmail } from "@/lib/engine/account-email";
import { useFailedOpsCount, useSyncStatus } from "@/lib/engine/sync-queries";
import {
  accountLines,
  failedOperationLines,
  syncLines,
} from "@/lib/engine/sync-report-lines";
import { useAccountStatus } from "@/lib/engine/use-account-status";

/**
 * What went wrong, with the account (email, user id), sync state, failed
 * operations and the app & device info, in a terminal to copy and send us,
 * under `intro`. For a sync or download that failed (`code`, `message`);
 * mount it only while it has failed.
 */
export const FailureReport = ({
  title,
  filename,
  intro,
  code,
  message,
}: {
  /** The report's first line, e.g. "Kanji Heatmap: couldn't sync". */
  title: string;
  filename: string;
  intro: ReactNode;
  code: string;
  message: string;
}) => {
  const { text: debugReport } = useDebugReport();
  const account = useAccountStatus();
  const email = useAccountEmail();
  const failed = useRecentFailedOperations().result;
  const sync = useSyncStatus();
  const failedOps = useFailedOpsCount()?.count;

  const report = [
    title,
    `Captured: ${formatCaptureTimestamp()}`,
    `Screen: ${window.location.pathname}`,
    `Error: ${code}`,
    `Message: ${message}`,
    "",
    ...accountLines(account, email),
    "",
    ...syncLines(sync, failedOps),
    "",
    ...failedOperationLines(
      failed.kind === "ready" ? failed.operations : undefined
    ),
    "",
    debugReport,
  ].join("\n");

  return (
    <div className="flex flex-col gap-2 text-left animate-fade-in-fast">
      {intro}
      <ErrorTerminal
        filename={filename}
        content={report}
        className="max-w-none"
      />
    </div>
  );
};
