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

function getBrowserName(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes("edg/")) return "Microsoft Edge";
  if (ua.includes("edga/")) return "Microsoft Edge Android";
  if (ua.includes("edgios/")) return "Microsoft Edge iOS";
  if (ua.includes("opr/") || ua.includes("oprgx/")) return "Opera";
  if (ua.includes("opera/")) return "Opera";
  if (ua.includes("samsungbrowser/")) return "Samsung Internet";
  if (ua.includes("ucbrowser/")) return "UC Browser";
  if (ua.includes("brave/") || ua.includes("brave chrome/")) return "Brave";
  if (ua.includes("vivaldi/")) return "Vivaldi";
  if (ua.includes("yabrowser/")) return "Yandex Browser";
  if (ua.includes("whale/")) return "Naver Whale";
  if (ua.includes("arc/")) return "Arc";
  if (ua.includes("firefox/") || ua.includes("fxios/")) return "Firefox";
  if (ua.includes("focus/")) return "Firefox Focus";
  if (
    ua.includes("safari/") &&
    !ua.includes("chrome/") &&
    !ua.includes("chromium/") &&
    !ua.includes("edg/")
  )
    return "Safari";
  if (
    ua.includes("chrome/") &&
    !ua.includes("chromium/") &&
    !ua.includes("edg/")
  )
    return "Chrome";
  if (ua.includes("chromium/")) return "Chromium";
  if (ua.includes("trident/") || ua.includes("msie"))
    return "Internet Explorer";
  return "Unknown";
}

function getBrowserVersion(userAgent: string): string {
  const ua = userAgent;
  const edgeMatch = ua.match(/Edg[A]?\/([0-9.]+)/i);
  if (edgeMatch) return edgeMatch[1];
  const edgeIOSMatch = ua.match(/EdgiOS\/([0-9.]+)/i);
  if (edgeIOSMatch) return edgeIOSMatch[1];
  const edgeLegacyMatch = ua.match(/Edge\/([0-9.]+)/);
  if (edgeLegacyMatch) return edgeLegacyMatch[1];
  const oprMatch = ua.match(/OPR\/([0-9.]+)/);
  if (oprMatch) return oprMatch[1];
  const operaMatch = ua.match(/Opera\/([0-9.]+)|Opera ([0-9.]+)/);
  if (operaMatch) return operaMatch[1] || operaMatch[2] || "Unknown";
  const samsungMatch = ua.match(/SamsungBrowser\/([0-9.]+)/);
  if (samsungMatch) return samsungMatch[1];
  const ucMatch = ua.match(/UCBrowser\/([0-9.]+)/);
  if (ucMatch) return ucMatch[1];
  const braveMatch = ua.match(/Brave\/([0-9.]+)/);
  if (braveMatch) return braveMatch[1];
  const vivaldiMatch = ua.match(/Vivaldi\/([0-9.]+)/);
  if (vivaldiMatch) return vivaldiMatch[1];
  const yandexMatch = ua.match(/YaBrowser\/([0-9.]+)/);
  if (yandexMatch) return yandexMatch[1];
  const arcMatch = ua.match(/Arc\/([0-9.]+)/);
  if (arcMatch) return arcMatch[1];
  const firefoxMatch = ua.match(/Firefox\/([0-9.]+)/);
  if (firefoxMatch) return firefoxMatch[1];
  const fxiosMatch = ua.match(/FxiOS\/([0-9.]+)/);
  if (fxiosMatch) return fxiosMatch[1];
  const chromeMatch = ua.match(/Chrome\/([0-9.]+)/);
  if (chromeMatch && !ua.includes("Edg/")) return chromeMatch[1];
  const chromiumMatch = ua.match(/Chromium\/([0-9.]+)/);
  if (chromiumMatch) return chromiumMatch[1];
  if (
    ua.includes("Safari") &&
    !ua.includes("Chrome") &&
    !ua.includes("Chromium")
  ) {
    const safariMatch = ua.match(/Version\/([0-9.]+)/);
    if (safariMatch) return safariMatch[1];
  }
  const ieMatch = ua.match(/(MSIE |rv:)([0-9.]+)/);
  if (ieMatch) return ieMatch[2];
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
