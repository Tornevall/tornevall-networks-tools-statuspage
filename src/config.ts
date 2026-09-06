export interface RuntimeConfig {
  apiBaseUrl: string;
  pageSlug: string;
  refreshIntervalSeconds: number;
  titleOverride: string | null;
}

const DEFAULT_REFRESH_SECONDS = 30;
const MIN_REFRESH_SECONDS = 10;
const MAX_REFRESH_SECONDS = 3600;

function normalizeBaseUrl(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
}

function normalizeSlug(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeTitle(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized === '' ? null : normalized;
}

function normalizeRefreshInterval(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_REFRESH_SECONDS;
  }

  return Math.min(MAX_REFRESH_SECONDS, Math.max(MIN_REFRESH_SECONDS, Math.round(parsed)));
}

function buildEnvFallback(): RuntimeConfig {
  return {
    apiBaseUrl: normalizeBaseUrl(import.meta.env.VITE_STATUS_API_BASE_URL),
    pageSlug: normalizeSlug(import.meta.env.VITE_STATUS_PAGE_SLUG),
    refreshIntervalSeconds: normalizeRefreshInterval(import.meta.env.VITE_STATUS_REFRESH_INTERVAL_SECONDS),
    titleOverride: null,
  };
}

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  const fallback = buildEnvFallback();
  const configUrl = `${import.meta.env.BASE_URL}status-config.json`;

  try {
    const response = await fetch(configUrl, { cache: 'no-store' });
    if (!response.ok) {
      return fallback;
    }

    const raw = (await response.json()) as Record<string, unknown>;

    return {
      apiBaseUrl: normalizeBaseUrl(raw.apiBaseUrl) || fallback.apiBaseUrl,
      pageSlug: normalizeSlug(raw.pageSlug) || fallback.pageSlug,
      refreshIntervalSeconds: normalizeRefreshInterval(
        raw.refreshIntervalSeconds ?? fallback.refreshIntervalSeconds,
      ),
      titleOverride: normalizeTitle(raw.titleOverride),
    };
  } catch {
    return fallback;
  }
}
