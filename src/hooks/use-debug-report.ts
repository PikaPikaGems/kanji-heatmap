import { useAiExplainUsage } from "@/hooks/use-ai-explain";
import { useAiStorageUsage } from "@/hooks/use-ai-storage-usage";
import { useAiVoiceState } from "@/hooks/use-ai-voice";
import {
  formatAiUsageForClipboard,
  formatDebugInfoForClipboard,
  formatStorageForClipboard,
  useDebugInfo,
} from "@/hooks/use-debug-info";

/**
 * Everything App & Device Info shows (app and device, storage, AI usage)
 * and the same as one plain-text report to copy and send us. The one source
 * for the modal, the account avatar's quick copy and the unsaved-answers
 * report.
 */
export const useDebugReport = () => {
  const info = useDebugInfo();
  const storage = useAiStorageUsage();
  const voice = useAiVoiceState();
  const aiUsage = useAiExplainUsage();

  const text = [
    formatDebugInfoForClipboard(info),
    ...formatStorageForClipboard(storage, voice),
    ...formatAiUsageForClipboard(aiUsage),
  ].join("\n");

  return { info, storage, voice, aiUsage, text };
};
