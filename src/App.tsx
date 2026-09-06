import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchStatusPage, StatusApiError } from './api/statusClient';
import { loadRuntimeConfig, type RuntimeConfig } from './config';
import type {
  ComponentStatus,
  IncidentSeverity,
  StatusIncident,
  StatusPayload,
} from './types/status';

const STATUS_ICONS: Record<ComponentStatus, string> = {
  operational: 'OK',
  degraded: '!',
  partial_outage: '!',
  major_outage: 'X',
  maintenance: 'M',
  unknown: '?',
};

function formatDate(value: string): string {
  if (!value) {
    return 'Unknown time';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatUptime(value: number | null): string {
  return value === null ? 'No data' : `${value.toFixed(value === 100 ? 0 : 2)}%`;
}

function safeHttpUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value, window.location.href);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function IncidentCard({ incident, historical = false }: { incident: StatusIncident; historical?: boolean }) {
  const affected = incident.affectedComponents.map((component) => component.name).join(', ');

  return (
    <article className={`incident-card severity-${incident.severity}`}>
      <div className="incident-heading">
        <div>
          <div className="eyebrow">{historical ? 'Previous incident' : 'Active incident'}</div>
          <h3>{incident.title}</h3>
        </div>
        <span className={`incident-status incident-${incident.status}`}>{incident.statusLabel}</span>
      </div>
      {incident.publicSummary && <p className="incident-summary">{incident.publicSummary}</p>}
      {affected && <p className="incident-affected">Affected: {affected}</p>}
      <div className="incident-meta">
        <span>Started {formatDate(incident.startedAt)}</span>
        {incident.resolvedAt && <span>Resolved {formatDate(incident.resolvedAt)}</span>}
      </div>
      {incident.updates.length > 0 && (
        <ol className="incident-timeline" aria-label="Incident updates">
          {incident.updates.map((update) => (
            <li key={update.id || `${update.createdAt}-${update.status}`}>
              <div className="timeline-dot" aria-hidden="true" />
              <div>
                <strong>{update.statusLabel}</strong>
                <time dateTime={update.createdAt}>{formatDate(update.createdAt)}</time>
                {update.message && <p>{update.message}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

function severityRank(severity: IncidentSeverity): number {
  return { critical: 4, major: 3, minor: 2, maintenance: 1, unknown: 0 }[severity];
}

export default function App() {
  const [config, setConfig] = useState<RuntimeConfig | null>(null);
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async (runtimeConfig: RuntimeConfig, initial = false) => {
    if (!initial) {
      setRefreshing(true);
    }

    try {
      const payload = await fetchStatusPage(runtimeConfig);
      setStatus(payload);
      setError(null);
    } catch (caught) {
      const message = caught instanceof StatusApiError
        ? caught.message
        : 'The public status API could not be reached.';
      setError(message);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    void loadRuntimeConfig().then((runtimeConfig) => {
      if (cancelled) {
        return;
      }

      setConfig(runtimeConfig);
      void refresh(runtimeConfig, true);
      timer = window.setInterval(
        () => void refresh(runtimeConfig),
        runtimeConfig.refreshIntervalSeconds * 1000,
      );
    });

    return () => {
      cancelled = true;
      if (timer !== undefined) {
        window.clearInterval(timer);
      }
    };
  }, [refresh]);

  useEffect(() => {
    const title = config?.titleOverride || status?.page.name;
    if (title) {
      document.title = `${title} - Status`;
    }
  }, [config?.titleOverride, status?.page.name]);

  const activeIncidents = useMemo(
    () => [...(status?.activeIncidents ?? [])].sort(
      (left, right) => severityRank(right.severity) - severityRank(left.severity),
    ),
    [status?.activeIncidents],
  );

  if (initialLoading && !status) {
    return (
      <main className="status-shell loading-shell" aria-busy="true">
        <div className="loading-pulse" />
        <p>Loading current service status...</p>
      </main>
    );
  }

  if (!status) {
    return (
      <main className="status-shell unavailable-shell">
        <div className="status-symbol status-major_outage">X</div>
        <h1>Status unavailable</h1>
        <p>{error || 'No public status page has been configured.'}</p>
        <p className="muted">The status application is running, but live status data is unavailable.</p>
        {config && (
          <button type="button" onClick={() => void refresh(config)} disabled={refreshing}>
            {refreshing ? 'Checking...' : 'Try again'}
          </button>
        )}
      </main>
    );
  }

  const homepageUrl = safeHttpUrl(status.page.homepageUrl);
  const logoUrl = safeHttpUrl(status.page.branding.logoUrl);
  const accentColor = status.page.branding.accentColor && CSS.supports('color', status.page.branding.accentColor)
    ? status.page.branding.accentColor
    : undefined;

  return (
    <main className="status-shell" style={accentColor ? { '--accent-color': accentColor } as React.CSSProperties : undefined}>
      <header className="page-header">
        <div className="brand-row">
          {logoUrl && <img className="brand-logo" src={logoUrl} alt="" />}
          <div>
            <div className="eyebrow">Service status</div>
            <h1>{status.page.name}</h1>
          </div>
        </div>
        {status.page.description && <p className="page-description">{status.page.description}</p>}
        {homepageUrl && (
          <a className="homepage-link" href={homepageUrl} rel="noopener noreferrer">
            Visit service website
          </a>
        )}
      </header>

      {error && (
        <section className="stale-warning" role="status">
          <strong>Live refresh failed.</strong> {error} Showing the most recent data received by this page.
        </section>
      )}

      <section className={`overall-card status-${status.overall.status}`} aria-label="Overall status">
        <div className={`status-symbol status-${status.overall.status}`} aria-hidden="true">
          {STATUS_ICONS[status.overall.status]}
        </div>
        <div>
          <div className="eyebrow">Current status</div>
          <h2>{status.overall.label}</h2>
          {status.overall.message && <p>{status.overall.message}</p>}
        </div>
      </section>

      {activeIncidents.length > 0 && (
        <section className="section-block" aria-labelledby="active-incidents-title">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Right now</div>
              <h2 id="active-incidents-title">Active incidents</h2>
            </div>
            <span className="count-badge">{activeIncidents.length}</span>
          </div>
          <div className="incident-stack">
            {activeIncidents.map((incident) => <IncidentCard key={incident.id} incident={incident} />)}
          </div>
        </section>
      )}

      <section className="section-block" aria-labelledby="services-title">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Components</div>
            <h2 id="services-title">Services</h2>
          </div>
          <span className="refresh-state" aria-live="polite">{refreshing ? 'Refreshing...' : 'Live'}</span>
        </div>
        <div className="service-list">
          {status.components.length === 0 && <p className="empty-state">No public services have been added yet.</p>}
          {status.components.map((component) => (
            <article className="service-row" key={component.id || component.key}>
              <div className="service-main">
                <span className={`mini-status status-${component.status}`} aria-hidden="true">
                  {STATUS_ICONS[component.status]}
                </span>
                <div>
                  <h3>{component.name}</h3>
                  {component.description && <p>{component.description}</p>}
                </div>
              </div>
              <div className="service-metrics">
                <span className={`service-state status-text-${component.status}`}>{component.statusLabel}</span>
                <span title="Uptime during the last 24 hours">24h {formatUptime(component.uptime.last24Hours)}</span>
                <span title="Uptime during the last 30 days">30d {formatUptime(component.uptime.last30Days)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block" aria-labelledby="history-title">
        <div className="section-heading">
          <div>
            <div className="eyebrow">History</div>
            <h2 id="history-title">Recent incidents</h2>
          </div>
        </div>
        {status.incidentHistory.length === 0 ? (
          <p className="empty-state">No recent incidents.</p>
        ) : (
          <div className="incident-stack">
            {status.incidentHistory.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} historical />
            ))}
          </div>
        )}
      </section>

      <footer className="page-footer">
        <span>Last status snapshot: {formatDate(status.generatedAt)}</span>
        <span>Refresh interval: {config?.refreshIntervalSeconds ?? 30}s</span>
      </footer>
    </main>
  );
}
