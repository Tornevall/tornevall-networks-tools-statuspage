import { describe, expect, it, vi } from 'vitest';
import type { RuntimeConfig } from '../config';
import { buildStatusApiUrl, fetchStatusPage, normalizeStatusPayload } from './statusClient';

const config: RuntimeConfig = {
  apiBaseUrl: 'https://api.example.test',
  pageSlug: 'example company',
  refreshIntervalSeconds: 30,
  titleOverride: null,
};

const payload = {
  schema_version: '1.0',
  page: {
    slug: 'example-company',
    name: 'Example Company',
    description: 'Public system status',
    homepage_url: 'https://example.test',
    branding: { logo_url: null, accent_color: '#2563eb' },
  },
  overall: { status: 'operational', label: 'All systems operational', message: null },
  components: [
    {
      id: 10,
      key: 'api',
      name: 'API',
      description: null,
      status: 'operational',
      status_label: 'Operational',
      uptime: { last_24_hours: 100, last_30_days: 99.98 },
    },
  ],
  active_incidents: [],
  incident_history: [],
  generated_at: '2026-08-21T21:30:00+02:00',
};

describe('statusClient', () => {
  it('builds the versioned public endpoint with an encoded page slug', () => {
    expect(buildStatusApiUrl(config)).toBe(
      'https://api.example.test/api/status/v1/pages/example%20company',
    );
  });

  it('normalizes a public status payload', () => {
    const normalized = normalizeStatusPayload(payload);

    expect(normalized.page.name).toBe('Example Company');
    expect(normalized.components[0].status).toBe('operational');
    expect(normalized.components[0].uptime.last30Days).toBe(99.98);
  });

  it('degrades unknown future status values safely', () => {
    const normalized = normalizeStatusPayload({
      ...payload,
      overall: { status: 'future_state' },
      components: [{ ...payload.components[0], status: 'future_state' }],
    });

    expect(normalized.overall.status).toBe('unknown');
    expect(normalized.components[0].status).toBe('unknown');
  });

  it('fetches and normalizes the public payload', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(payload), { status: 200 }));

    const result = await fetchStatusPage(config, fetchMock as unknown as typeof fetch);

    expect(result.overall.label).toBe('All systems operational');
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.example.test/api/status/v1/pages/example%20company',
    );
  });
});
