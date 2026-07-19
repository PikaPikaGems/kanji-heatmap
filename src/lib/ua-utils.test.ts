import { describe, expect, it } from "vitest";
import { getUserAgentData } from "./ua-utils";

const CHROME_WIN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const SAFARI_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const FIREFOX_LINUX =
  "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0";
const EDGE_WIN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.2592.87";
const OPERA_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 OPR/111.0.0.0";
const SAMSUNG_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36";
const IE11_WIN =
  "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko";

describe("getUserAgentData browser detection", () => {
  it.each([
    [CHROME_WIN, "Chrome", "126.0.0.0"],
    [SAFARI_IOS, "Safari", "17.5"],
    [FIREFOX_LINUX, "Firefox", "127.0"],
    [EDGE_WIN, "Microsoft Edge", "126.0.2592.87"],
    [OPERA_MAC, "Opera", "111.0.0.0"],
    [SAMSUNG_ANDROID, "Samsung Internet", "25.0"],
    [IE11_WIN, "Internet Explorer", "11.0"],
  ])("identifies %#: %s", (ua, name, version) => {
    const { browser } = getUserAgentData(ua);
    expect(browser.name).toBe(name);
    expect(browser.version).toBe(version);
  });

  it("returns Unknown for an unrecognized agent", () => {
    const { browser } = getUserAgentData("SomeBot/1.0");
    expect(browser).toEqual({ name: "Unknown", version: "Unknown" });
  });
});

describe("getUserAgentData os/platform", () => {
  it("reads Windows details", () => {
    const data = getUserAgentData(CHROME_WIN);
    expect(data.os).toEqual({ name: "Windows", version: "10/11" });
    expect(data.platform.platform).toBe("Windows x64");
  });

  it("reads iOS details", () => {
    const data = getUserAgentData(SAFARI_IOS);
    expect(data.os).toEqual({ name: "iOS", version: "17.5" });
    expect(data.platform.platform).toBe("iPhone");
  });
});
