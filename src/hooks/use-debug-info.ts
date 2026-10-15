import { useWindowSize } from "@/hooks/use-window-size";
import { useNetworkState, type NetworkState } from "@/hooks/use-network-state";
import { getUserAgentData, type UserAgentData } from "@/lib/ua-utils";
import type { AiStorageUsageState } from "@/hooks/use-ai-storage-usage";
import type { AiVoiceState } from "@/lib/ai-voice/engine";
import { AI_STORAGE_LIMITS } from "@/lib/ai-explain/storage-budgets";
import { formatMegabytes } from "@/lib/format-bytes";

declare const __BUILD_TIMESTAMP__: string;

export type DebugInfoSnapshot = {
  online: boolean;
  effectiveType?: NetworkState["effectiveType"];
  saveData?: boolean;
  version: string;
  viewportWidth: number;
  viewportHeight: number;
  device: UserAgentData | null;
};

const pad = (n: number) => String(n).padStart(2, "0");

const formatGmtOffset = (date: Date) => {
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  return `GMT${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
};

export const formatCaptureTimestamp = (date = new Date()) => {
  const timeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown";
  const local = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return `${local} ${formatGmtOffset(date)} (${timeZone})`;
};

export const formatDebugInfoForClipboard = (
  info: DebugInfoSnapshot,
  capturedAt = new Date()
) => {
  const network = [
    info.online ? "online" : "offline",
    info.effectiveType,
    info.saveData ? "save-data" : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  const lines = [
    "Kanji Heatmap debug",
    `Captured: ${formatCaptureTimestamp(capturedAt)}`,
    "",
    `Network: ${network}`,
    `Version: ${info.version}`,
    `Viewport: ${info.viewportWidth}×${info.viewportHeight}`,
  ];

  if (info.device) {
    const { os, browser, platform } = info.device;
    lines.push(
      "",
      `OS: ${os.name} · ${os.version} · ${platform.platform}`,
      `Browser: ${browser.name} · ${browser.version}`
    );
  }

  return lines.join("\n");
};

/** The offline Japanese Voice model, as Debug Info shows it. */
export const voiceModelStatus = (voice: AiVoiceState) => {
  if (voice.cached == null) return "Checking…";
  if (!voice.cached) return "Not downloaded";
  return voice.downloadMB != null
    ? `${voice.downloadMB} MB downloaded`
    : "Downloaded";
};

/** Copied storage summary: one line per bar, with the current user's share. */
export const formatStorageForClipboard = (
  storage: AiStorageUsageState,
  voice: AiVoiceState
) => {
  const lines = ["", "Storage"];
  if (storage.status !== "ready") {
    lines.push(
      storage.status === "loading"
        ? "Checking storage…"
        : "Couldn't read storage."
    );
  } else {
    const { usage, estimate } = storage;
    for (const [label, kind] of [
      ["Text", "text"],
      ["MP3", "audio"],
      ["Images", "images"],
    ] as const) {
      const { mine, others } = usage[kind];
      lines.push(
        `${label}: ${formatMegabytes(mine + others)} of ${formatMegabytes(AI_STORAGE_LIMITS[kind])} (you ${formatMegabytes(mine)}, others ${formatMegabytes(others)})`
      );
    }
    if (estimate)
      lines.push(
        `Everything this site stores: ${formatMegabytes(estimate.usage)} of ${formatMegabytes(estimate.quota)}`
      );
  }
  lines.push(`Offline Japanese voice: ${voiceModelStatus(voice)}`);
  return lines;
};

export function useDebugInfo(): DebugInfoSnapshot {
  const { online, effectiveType, saveData } = useNetworkState();
  const [viewportWidth, viewportHeight] = useWindowSize(0);
  const device =
    typeof navigator !== "undefined" && navigator.userAgent
      ? getUserAgentData(navigator.userAgent)
      : null;

  return {
    online,
    effectiveType,
    saveData,
    version: __BUILD_TIMESTAMP__,
    viewportWidth,
    viewportHeight,
    device,
  };
}
