interface BrowserInfo {
  name: string;
  version: string;
}
interface OSInfo {
  name: string;
  version: string;
}
interface PlatformInfo {
  platform: string;
}
interface UserAgentData {
  browser: BrowserInfo;
  os: OSInfo;
  platform: PlatformInfo;
}

// One roster drives both browser name and version detection, so the two can't
// drift apart (previously they were parallel if-chains that had to be kept in
// sync by hand). First matching rule wins; `version` regexes are tried in
// order so Chromium-based browsers can fall back to the engine's version.
type BrowserRule = {
  name: string;
  /** Any of these lowercase tokens marks the browser as present. */
  match: string[];
  /** All of these must be absent (e.g. Chrome is chrome/ without edg/). */
  exclude?: string[];
  /** First regex with a capture that matches provides the version. */
  version: RegExp[];
};

const BROWSER_RULES: BrowserRule[] = [
  { name: "Microsoft Edge", match: ["edg/"], version: [/Edg\/([0-9.]+)/] },
  {
    name: "Microsoft Edge Android",
    match: ["edga/"],
    version: [/EdgA\/([0-9.]+)/i],
  },
  {
    name: "Microsoft Edge iOS",
    match: ["edgios/"],
    version: [/EdgiOS\/([0-9.]+)/i],
  },
  {
    name: "Opera",
    match: ["opr/", "oprgx/", "opera/"],
    version: [/OPR\/([0-9.]+)/, /Opera\/([0-9.]+)/, /Opera ([0-9.]+)/],
  },
  {
    name: "Samsung Internet",
    match: ["samsungbrowser/"],
    version: [/SamsungBrowser\/([0-9.]+)/],
  },
  {
    name: "UC Browser",
    match: ["ucbrowser/"],
    version: [/UCBrowser\/([0-9.]+)/],
  },
  {
    name: "Brave",
    match: ["brave/", "brave chrome/"],
    version: [/Brave\/([0-9.]+)/, /Chrome\/([0-9.]+)/],
  },
  { name: "Vivaldi", match: ["vivaldi/"], version: [/Vivaldi\/([0-9.]+)/] },
  {
    name: "Yandex Browser",
    match: ["yabrowser/"],
    version: [/YaBrowser\/([0-9.]+)/],
  },
  {
    name: "Naver Whale",
    match: ["whale/"],
    version: [/Whale\/([0-9.]+)/, /Chrome\/([0-9.]+)/],
  },
  {
    name: "Arc",
    match: ["arc/"],
    version: [/Arc\/([0-9.]+)/, /Chrome\/([0-9.]+)/],
  },
  {
    name: "Firefox",
    match: ["firefox/", "fxios/"],
    version: [/Firefox\/([0-9.]+)/, /FxiOS\/([0-9.]+)/],
  },
  {
    name: "Firefox Focus",
    match: ["focus/"],
    version: [/Focus\/([0-9.]+)/, /Firefox\/([0-9.]+)/],
  },
  {
    name: "Safari",
    match: ["safari/"],
    exclude: ["chrome/", "chromium/", "edg/"],
    version: [/Version\/([0-9.]+)/],
  },
  {
    name: "Chrome",
    match: ["chrome/"],
    exclude: ["chromium/", "edg/"],
    version: [/Chrome\/([0-9.]+)/],
  },
  { name: "Chromium", match: ["chromium/"], version: [/Chromium\/([0-9.]+)/] },
  {
    name: "Internet Explorer",
    match: ["trident/", "msie"],
    version: [/MSIE ([0-9.]+)/, /rv:([0-9.]+)/],
  },
];

const findBrowserRule = (userAgent: string) => {
  const ua = userAgent.toLowerCase();
  return BROWSER_RULES.find(
    (rule) =>
      rule.match.some((token) => ua.includes(token)) &&
      !(rule.exclude ?? []).some((token) => ua.includes(token))
  );
};

function getBrowserName(userAgent: string): string {
  return findBrowserRule(userAgent)?.name ?? "Unknown";
}

function getBrowserVersion(userAgent: string): string {
  const rule = findBrowserRule(userAgent);
  for (const regex of rule?.version ?? []) {
    const match = userAgent.match(regex);
    if (match) return match[1];
  }
  return "Unknown";
}

function getOSName(userAgent: string): string {
  const ua = userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows Phone/i.test(ua)) return "Windows Phone";
  if (/Windows NT/i.test(ua)) return "Windows";
  if (/Mac OS X/i.test(ua)) return "macOS";
  if (/CrOS/i.test(ua)) return "Chrome OS";
  if (/Ubuntu/i.test(ua)) return "Ubuntu";
  if (/Fedora/i.test(ua)) return "Fedora";
  if (/Debian/i.test(ua)) return "Debian";
  if (/Linux Mint/i.test(ua)) return "Linux Mint";
  if (/CentOS/i.test(ua)) return "CentOS";
  if (/Red Hat|RHEL/i.test(ua)) return "Red Hat";
  if (/Arch Linux/i.test(ua)) return "Arch Linux";
  if (/Linux/i.test(ua)) return "Linux";
  if (/FreeBSD/i.test(ua)) return "FreeBSD";
  if (/OpenBSD/i.test(ua)) return "OpenBSD";
  if (/NetBSD/i.test(ua)) return "NetBSD";
  if (/SunOS/i.test(ua)) return "Solaris";
  if (/HP-UX/i.test(ua)) return "HP-UX";
  if (/AIX/i.test(ua)) return "AIX";
  return "Unknown";
}

function getOSVersion(userAgent: string): string {
  const ua = userAgent;
  const winMatch = ua.match(/Windows NT ([0-9.]+)/);
  if (winMatch) {
    const versionMap: Record<string, string> = {
      "10.0": "10/11",
      "6.3": "8.1",
      "6.2": "8",
      "6.1": "7",
      "6.0": "Vista",
      "5.2": "Server 2003/XP x64",
      "5.1": "XP",
      "5.0": "2000",
    };
    return versionMap[winMatch[1]] || winMatch[1];
  }
  const winPhoneMatch = ua.match(/Windows Phone( OS)? ([0-9.]+)/);
  if (winPhoneMatch) return winPhoneMatch[2] || "Unknown";
  const macMatch = ua.match(/Mac OS X ([0-9_]+)/);
  if (macMatch) {
    const version = macMatch[1].replace(/_/g, ".");
    const majorMinor = version.split(".").slice(0, 2).join(".");
    if (majorMinor === "10.15") return "Catalina↑";
    const macVersionMap: Record<string, string> = {
      "10.14": "Mojave",
      "10.13": "High Sierra",
      "10.12": "Sierra",
      "10.11": "El Capitan",
      "10.10": "Yosemite",
      "10.9": "Mavericks",
      "10.8": "Mountain Lion",
      "10.7": "Lion",
    };
    return macVersionMap[majorMinor] || version;
  }
  const iosMatch = ua.match(/OS ([0-9_]+)/);
  if (iosMatch) return iosMatch[1].replace(/_/g, ".");
  const androidMatch = ua.match(/Android ([0-9.]+)/);
  if (androidMatch) return androidMatch[1];
  const chromeOSMatch = ua.match(/CrOS ([a-z0-9_]+) ([0-9.]+)/);
  if (chromeOSMatch) return chromeOSMatch[2];
  return "Unknown";
}

function getPlatform(userAgent: string): string {
  const ua = userAgent;
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/iPod/i.test(ua)) return "iPod";
  if (/Android/i.test(ua)) {
    if (/aarch64|arm64/i.test(ua)) return "Android ARM64";
    if (/armv8/i.test(ua)) return "Android ARMv8";
    if (/armv7/i.test(ua)) return "Android ARMv7";
    return "Android";
  }
  if (/Windows NT/i.test(ua)) {
    if (/ARM64|WOA64/i.test(ua)) return "Windows ARM64";
    if (/Win64|x64|WOW64|x86_64/i.test(ua)) return "Windows x64";
    return "Windows x86";
  }
  if (/Macintosh|Mac OS X/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) {
    if (/x86_64|amd64/i.test(ua)) return "Linux x86_64";
    if (/aarch64|arm64/i.test(ua)) return "Linux ARM64";
    if (/armv8l|armv8/i.test(ua)) return "Linux ARMv8";
    if (/armv7l|armv7/i.test(ua)) return "Linux ARMv7";
    if (/armv6l|armv6/i.test(ua)) return "Linux ARMv6";
    if (/i686|i386/i.test(ua)) return "Linux i686";
    return "Linux";
  }
  if (/CrOS/i.test(ua)) {
    const archMatch = ua.match(/CrOS ([a-z0-9_]+)/);
    if (archMatch) return `Chrome OS ${archMatch[1]}`;
    return "Chrome OS";
  }
  if (/FreeBSD/i.test(ua)) {
    if (/amd64|x86_64/i.test(ua)) return "FreeBSD amd64";
    if (/i386/i.test(ua)) return "FreeBSD i386";
    return "FreeBSD";
  }
  if (/OpenBSD/i.test(ua)) return "OpenBSD";
  if (/NetBSD/i.test(ua)) return "NetBSD";
  if (/SunOS/i.test(ua)) return "Solaris";
  if (/HP-UX/i.test(ua)) return "HP-UX";
  if (/AIX/i.test(ua)) return "AIX";
  return "Unknown";
}

function getUserAgentData(userAgent: string): UserAgentData {
  return {
    browser: {
      name: getBrowserName(userAgent),
      version: getBrowserVersion(userAgent),
    },
    os: { name: getOSName(userAgent), version: getOSVersion(userAgent) },
    platform: { platform: getPlatform(userAgent) },
  };
}

export { getUserAgentData };
export type { UserAgentData };
