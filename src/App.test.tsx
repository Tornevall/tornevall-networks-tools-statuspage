import { act, render, screen } from '@testing-library/react';
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
      uptime: {
        last_24_hours: 99.75,
        last_30_days: 99.98,
      },
      history: [
        { date: '2026-08-19', status: 'operational', availability: 100 },
        { date: '2026-08-20', status: 'partial_outage', availability: 97.5 },
        { date: '2026-08-21', status: 'operational', availability: 100 },
      ],
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
  vi.useRealTimers();
});

describe('App', () => {
  it('renders live page, component, uptime history and incident state from the public API', async () => {
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
    expect(screen.getByLabelText('Overall status')).toHaveClass('overall-status-degraded');
    expect(screen.getByRole('heading', { name: 'Public API' })).toBeInTheDocument();
    expect(screen.getByText('24h 99.75%')).toBeInTheDocument();
    expect(screen.getByText('30d 99.98%')).toBeInTheDocument();
    expect(screen.getByLabelText('Public API daily status history')).toBeInTheDocument();
    expect(screen.getByLabelText(/partial outage, 97.50% available/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Elevated API latency' })).toBeInTheDocument();
    expect(screen.getByText('Some API requests are slower than normal.')).toBeInTheDocument();
  });

  it('removes a previously green snapshot on a failed refresh and recovers on fresh data', async () => {
    vi.useFakeTimers();
    let requests = 0;
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes('status-config.json')) {
        return new Response(JSON.stringify({
          apiBaseUrl: 'https://api.example.test',
          pageSlug: 'example-company',
          refreshIntervalSeconds: 10,
        }), { status: 200 });
      }
      requests += 1;
      if (requests === 2) {
        return new Response('', { status: 503 });
      }
      return new Response(JSON.stringify({
        ...statusPayload,
        status: 'operational',
        components: [{ ...statusPayload.components[0], status: 'operational' }],
        incidents: [],
      }), { status: 200 });
    }));

    render(<App />);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(screen.getByLabelText('Overall status')).toHaveClass('overall-status-operational');

    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(screen.getByRole('heading', { name: 'Status unavailable' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Overall status')).not.toBeInTheDocument();
    expect(screen.queryByText('Live', { exact: true })).not.toBeInTheDocument();

    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(screen.getByLabelText('Overall status')).toHaveClass('overall-status-operational');
    expect(screen.queryByRole('heading', { name: 'Status unavailable' })).not.toBeInTheDocument();
  });
});
