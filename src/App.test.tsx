import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const statusPayload = {
  slug: 'example-company',
  name: 'Example Company',
  description: 'Public system status',
  status: 'degraded',
  published_at: '2026-08-21T21:00:00+02:00',
  components: [
    {
      id: 1,
      name: 'Public API',
      description: 'Requests and integrations',
      status: 'degraded',
      sort_order: 0,
    },
  ],
  incidents: [
    {
      id: 99,
      title: 'Elevated API latency',
      impact: 'major',
      status: 'investigating',
      summary: 'Some API requests are slower than normal.',
      opened_at: '2026-08-21T21:00:00+02:00',
      resolved_at: null,
      updates: [],
    },
  ],
  events: [],
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
    expect(screen.getByRole('heading', { name: 'Degraded', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Public API' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Elevated API latency' })).toBeInTheDocument();
    expect(screen.getByText('Some API requests are slower than normal.')).toBeInTheDocument();
  });
});
