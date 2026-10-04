"use client";

export interface DeviceMetadata {
  collected_at: string;
  locale: string | null;
  timezone: string | null;
  platform: string | null;
  screen: string | null;
  viewport: string | null;
  device_pixel_ratio: number | null;
  color_depth: number | null;
  cpu_cores: number | null;
  device_memory_gb: number | null;
  touch_support: boolean | null;
  languages: string[] | null;
  cookies_enabled: boolean | null;
  do_not_track: string | null;
  user_agent: string | null;
  vendor: string | null;
  connection: string | null;
  battery: string | null;
  pdf_viewer: boolean | null;
  webdriver: boolean;
  page_visibility: string | null;
  referrer: string | null;
  timezone_offset_min: number | null;
  client_hints: Record<string, string> | null;
  storage_quota_estimate: string | null;
}

function safe<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

type NavigatorConnection = { effectiveType?: string; type?: string; downlink?: number };
type UAData = { brands?: { brand: string; version: string }[]; platform?: string; mobile?: boolean };
type NavigatorWithExtras = Navigator & {
  connection?: NavigatorConnection;
  mozConnection?: NavigatorConnection;
  deviceMemory?: number;
  userAgentData?: UAData;
  msMaxTouchPoints?: number;
};

/**
 * Collects as much non-invasive device fingerprint data as browsers expose
 * (per requirements: metadata helps verify that participants submit their own quiz).
 * No blocking APIs — everything is a cheap synchronous read or a best-effort promise.
 */
export function collectDeviceMetadata(): DeviceMetadata {
  const nav = navigator as NavigatorWithExtras;
  const conn = nav.connection ?? nav.mozConnection;
  const screen = window.screen;

  const clientHints: Record<string, string> = {};
  const brands = safe(() => nav.userAgentData?.brands);
  if (Array.isArray(brands)) {
    for (const b of brands) if (b?.brand && b?.version) clientHints[`brand:${b.brand}`] = b.version;
  }
  const platformCH = safe(() => nav.userAgentData?.platform);
  if (platformCH) clientHints["platform"] = platformCH;
  const mobileCH = safe(() => nav.userAgentData?.mobile);
  if (mobileCH !== null && mobileCH !== undefined) clientHints["mobile"] = String(mobileCH);

  return {
    collected_at: new Date().toISOString(),
    locale: safe(() => navigator.language),
    timezone: safe(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
    timezone_offset_min: safe(() => -new Date().getTimezoneOffset()),
    platform: safe(() => navigator.platform),
    screen: screen ? `${screen.width}x${screen.height}` : null,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    device_pixel_ratio: safe(() => window.devicePixelRatio) ?? null,
    color_depth: screen?.colorDepth ?? null,
    cpu_cores: safe(() => navigator.hardwareConcurrency) ?? null,
    device_memory_gb: safe(() => (nav.deviceMemory ?? null)) ?? null,
    touch_support: safe(() =>
      "ontouchstart" in window ||
      (navigator.maxTouchPoints ?? 0) > 0 ||
      (nav.msMaxTouchPoints ?? 0) > 0,
    ) ?? null,
    languages: safe(() => Array.from(navigator.languages ?? [])) ?? null,
    cookies_enabled: safe(() => navigator.cookieEnabled) ?? null,
    do_not_track: safe(() => navigator.doNotTrack) ?? null,
    user_agent: safe(() => navigator.userAgent),
    vendor: safe(() => navigator.vendor) ?? null,
    connection: conn
      ? [conn.effectiveType, conn.type, conn.downlink != null ? `${conn.downlink}Mb/s` : null]
          .filter(Boolean).join(" / ") || null
      : null,
    battery: null, // filled asynchronously by fillBattery()
    pdf_viewer: safe(() => navigator.pdfViewerEnabled) ?? null,
    webdriver: Boolean(safe(() => navigator.webdriver)),
    page_visibility: safe(() => document.visibilityState) ?? null,
    referrer: safe(() => document.referrer) || null,
    client_hints: Object.keys(clientHints).length ? clientHints : null,
    storage_quota_estimate: null, // filled asynchronously by fillStorageEstimate()
  };
}

/** Best-effort async enrichments; call right after collectDeviceMetadata(). */
export async function enrichDeviceMetadata(meta: DeviceMetadata): Promise<DeviceMetadata> {
  const battery = await safeP(async () => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number; charging: boolean }> };
    if (!nav.getBattery) return null;
    const b = await nav.getBattery();
    return `${Math.round(b.level * 100)}%${b.charging ? " (charging)" : ""}`;
  });
  if (battery) meta.battery = battery;

  const quota = await safeP(async () => {
    if (!navigator.storage?.estimate) return null;
    const est = await navigator.storage.estimate();
    if (est.quota == null) return null;
    const gb = (est.quota / 1024 / 1024 / 1024).toFixed(2);
    return `${gb} GB (${est.usage != null ? Math.round(est.usage / 1024 / 1024) + " MB used" : "?"})`;
  });
  if (quota) meta.storage_quota_estimate = quota;

  return meta;
}

async function safeP<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

/** Small, stable, non-reversible device marker stored in localStorage (extra anti-cheat signal). */
export function getDeviceFingerprint(): string {
  const KEY = "quiz_device_fp";
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const fp = `fp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(KEY, fp);
    return fp;
  } catch {
    return "fp_unavailable";
  }
}
