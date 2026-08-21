import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const statusPayload = {
  schema_version: '1.0',
  page: {
    slug: 'example-company',
    name: 'Example Company',
    description: 'Public system status',
    homepage_url: null,
    branding: { logo_url: null, accent_color: null },
  },
  overall: {
    status: 'degraded',
    label: 'Some systems are degraded',
    message: 'We are investigating elevated API latency.',
  },
  components: [
    {
      id: 1,
      key: 'api',
      name: 'Public API',
      description: 'Requests and integrations',
      status: 'degraded',
      status_label: 'Degraded performance',
      uptime: { last_24_hours: 99.9, last_30_days: 99.99 },
    },
  ],
  active_incidents: [
    {
      id: 99,
      slug: 'api-latency',
      title: 'Elevated API latency',
      severity: 'major',
      status: 'investigating',
      status_label: 'Investigating',
      public_summary: 'Some API requests are slower than normal.',
      started_at: '2026-08-21T21:00:00+02:00',
      updated_at: '2026-08-21T21:15:00+02:00',
      resolved_at: null,
      affected_components: [{ id: 1, key: 'api', name: 'Public API' }],
      updates: [],
    },
  ],
  incident_history: [],
  generated_at: '2026-08-21T21:30:00+02:00',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('renders live page, component and incident state from the public API', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('status-config.json')) {
        return new Response(JSON.stringify({
          apiBaseUrl: 'https://api.example.test',
          pageSlug: 'example-company',
          refreshIntervalSeconds: 60,
        }), { status: 200 });
      }

      return new Response(JSON.stringify(statusPayload), { status: 200 });
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Example Company' })).toBeInTheDocument();
    expect(screen.getByText('Some systems are degraded')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Public API' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Elevated API latency' })).toBeInTheDocument();
    expect(screen.getByText('Some API requests are slower than normal.')).toBeInTheDocument();
  });
});
