import type { RuntimeConfig } from '../config';
import type {
  ComponentStatus,
  IncidentComponentRef,
  IncidentSeverity,
  IncidentStatus,
  IncidentUpdate,
  StatusComponent,
  StatusIncident,
  StatusPayload,
} from '../types/status';

const COMPONENT_STATUSES: readonly ComponentStatus[] = [
  'operational',
  'degraded',
  'partial_outage',
  'major_outage',
  'maintenance',
  'unknown',
];
const INCIDENT_SEVERITIES: readonly IncidentSeverity[] = [
  'minor',
  'major',
  'critical',
  'maintenance',
  'unknown',
];
const INCIDENT_STATUSES: readonly IncidentStatus[] = [
  'investigating',
  'identified',
  'monitoring',
  'resolved',
  'scheduled',
  'unknown',
];

export class StatusApiError extends Error {
  constructor(
    message: string,
    public readonly code: 'CONFIGURATION' | 'HTTP' | 'INVALID_PAYLOAD' | 'NETWORK',
    public readonly httpStatus: number | null = null,
  ) {
    super(message);
    this.name = 'StatusApiError';
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function nullableString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized === '' ? null : normalized;
}

function percentage(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(0, Math.min(100, parsed));
}

function normalizeEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback;
}

function humanize(value: string): string {
  if (value === '') {
    return 'Unknown';
  }

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function parseComponent(value: unknown): StatusComponent {
  const raw = asRecord(value);
  const uptime = asRecord(raw.uptime);
  const status = normalizeEnum(raw.status, COMPONENT_STATUSES, 'unknown');

  return {
    id: String(raw.id ?? raw.key ?? ''),
    key: asString(raw.key, String(raw.id ?? '')),
    name: asString(raw.name, 'Unnamed service'),
    description: nullableString(raw.description),
    status,
    statusLabel: asString(raw.status_label, humanize(status)),
    uptime: {
      last24Hours: percentage(uptime.last_24_hours),
      last30Days: percentage(uptime.last_30_days),
    },
  };
}

function parseIncidentComponent(value: unknown): IncidentComponentRef {
  const raw = asRecord(value);
  return {
    id: String(raw.id ?? raw.key ?? ''),
    key: asString(raw.key, String(raw.id ?? '')),
    name: asString(raw.name, 'Unnamed service'),
  };
}

function parseIncidentUpdate(value: unknown): IncidentUpdate {
  const raw = asRecord(value);
  const status = normalizeEnum(raw.status, INCIDENT_STATUSES, 'unknown');

  return {
    id: String(raw.id ?? ''),
    status,
    statusLabel: asString(raw.status_label, humanize(status)),
    message: asString(raw.message),
    createdAt: asString(raw.created_at),
  };
}

function parseIncident(value: unknown): StatusIncident {
  const raw = asRecord(value);
  const status = normalizeEnum(raw.status, INCIDENT_STATUSES, 'unknown');

  return {
    id: String(raw.id ?? raw.slug ?? ''),
    slug: asString(raw.slug, String(raw.id ?? '')),
    title: asString(raw.title, 'Incident'),
    severity: normalizeEnum(raw.severity, INCIDENT_SEVERITIES, 'unknown'),
    status,
    statusLabel: asString(raw.status_label, humanize(status)),
    publicSummary: nullableString(raw.public_summary),
    startedAt: asString(raw.started_at),
    updatedAt: asString(raw.updated_at),
    resolvedAt: nullableString(raw.resolved_at),
    affectedComponents: asArray(raw.affected_components).map(parseIncidentComponent),
    updates: asArray(raw.updates).map(parseIncidentUpdate),
  };
}

export function normalizeStatusPayload(value: unknown): StatusPayload {
  const raw = asRecord(value);
  const page = asRecord(raw.page);
  const branding = asRecord(page.branding);
  const overall = asRecord(raw.overall);
  const overallStatus = normalizeEnum(overall.status, COMPONENT_STATUSES, 'unknown');
  const slug = asString(page.slug).trim();
  const name = asString(page.name).trim();

  if (slug === '' || name === '') {
    throw new StatusApiError('The status API response is missing page identity.', 'INVALID_PAYLOAD');
  }

  return {
    schemaVersion: asString(raw.schema_version, '1.0'),
    page: {
      slug,
      name,
      description: nullableString(page.description),
      homepageUrl: nullableString(page.homepage_url),
      branding: {
        logoUrl: nullableString(branding.logo_url),
        accentColor: nullableString(branding.accent_color),
      },
    },
    overall: {
      status: overallStatus,
      label: asString(overall.label, humanize(overallStatus)),
      message: nullableString(overall.message),
    },
    components: asArray(raw.components).map(parseComponent),
    activeIncidents: asArray(raw.active_incidents).map(parseIncident),
    incidentHistory: asArray(raw.incident_history).map(parseIncident),
    generatedAt: asString(raw.generated_at),
  };
}

export function buildStatusApiUrl(config: RuntimeConfig): string {
  const slug = config.pageSlug.trim();
  if (slug === '') {
    throw new StatusApiError('No status page slug has been configured.', 'CONFIGURATION');
  }

  return `${config.apiBaseUrl}/api/status/v1/pages/${encodeURIComponent(slug)}`;
}

export async function fetchStatusPage(
  config: RuntimeConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<StatusPayload> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetchImpl(buildStatusApiUrl(config), {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new StatusApiError(
        `Status API returned HTTP ${response.status}.`,
        'HTTP',
        response.status,
      );
    }

    return normalizeStatusPayload(await response.json());
  } catch (error) {
    if (error instanceof StatusApiError) {
      throw error;
    }

    throw new StatusApiError('The public status API could not be reached.', 'NETWORK');
  } finally {
    window.clearTimeout(timeout);
  }
}
