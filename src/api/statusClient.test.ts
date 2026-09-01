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
  slug: 'example-company',
  name: 'Example Company',
  description: 'Public system status',
  status: 'operational',
  published_at: '2026-08-21T21:00:00+02:00',
  components: [
    {
      id: 10,
      name: 'API',
      description: null,
      status: 'operational',
      sort_order: 0,
    },
  ],
  incidents: [
    {
      id: 20,
      title: 'Elevated API latency',
      status: 'investigating',
      impact: 'major',
      summary: 'Some requests are slower than normal.',
      opened_at: '2026-08-21T20:30:00+02:00',
      resolved_at: null,
      updates: [
        {
          id: 30,
          status: 'investigating',
          message: 'We are investigating elevated latency.',
          published_at: '2026-08-21T20:45:00+02:00',
        },
      ],
    },
  ],
  events: [],
};

describe('statusClient', () => {
  it('builds the unversioned public endpoint with an encoded page slug', () => {
    expect(buildStatusApiUrl(config)).toBe(
      'https://api.example.test/api/statuspage/example%20company',
    );
  });

  it('normalizes the ToolsAPI public status payload', () => {
    const normalized = normalizeStatusPayload(payload);

    expect(normalized.page.name).toBe('Example Company');
    expect(normalized.overall.status).toBe('operational');
    expect(normalized.components[0].status).toBe('operational');
    expect(normalized.components[0].uptime.last30Days).toBeNull();
    expect(normalized.activeIncidents[0].severity).toBe('major');
    expect(normalized.activeIncidents[0].publicSummary).toBe('Some requests are slower than normal.');
    expect(normalized.activeIncidents[0].updates[0].createdAt).toBe('2026-08-21T20:45:00+02:00');
  });

  it('degrades unknown future status values safely', () => {
    const normalized = normalizeStatusPayload({
      ...payload,
      status: 'future_state',
      components: [{ ...payload.components[0], status: 'future_state' }],
    });

    expect(normalized.overall.status).toBe('unknown');
    expect(normalized.components[0].status).toBe('unknown');
  });

  it('fetches and normalizes the public payload', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { Date: 'Fri, 21 Aug 2026 19:30:00 GMT' },
      }));

    const result = await fetchStatusPage(config, fetchMock as unknown as typeof fetch);

    expect(result.overall.label).toBe('Operational');
    expect(result.generatedAt).toBe('Fri, 21 Aug 2026 19:30:00 GMT');
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.example.test/api/statuspage/example%20company',
    );
  });
});
