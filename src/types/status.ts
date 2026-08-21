export type ComponentStatus =
  | 'operational'
  | 'degraded'
  | 'partial_outage'
  | 'major_outage'
  | 'maintenance'
  | 'unknown';

export type IncidentSeverity = 'minor' | 'major' | 'critical' | 'maintenance' | 'unknown';
export type IncidentStatus =
  | 'investigating'
  | 'identified'
  | 'monitoring'
  | 'resolved'
  | 'scheduled'
  | 'unknown';

export interface StatusBranding {
  logoUrl: string | null;
  accentColor: string | null;
}

export interface StatusPageIdentity {
  slug: string;
  name: string;
  description: string | null;
  homepageUrl: string | null;
  branding: StatusBranding;
}

export interface UptimeSummary {
  last24Hours: number | null;
  last30Days: number | null;
}

export interface StatusComponent {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: ComponentStatus;
  statusLabel: string;
  uptime: UptimeSummary;
}

export interface IncidentUpdate {
  id: string;
  status: IncidentStatus;
  statusLabel: string;
  message: string;
  createdAt: string;
}

export interface IncidentComponentRef {
  id: string;
  key: string;
  name: string;
}

export interface StatusIncident {
  id: string;
  slug: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  statusLabel: string;
  publicSummary: string | null;
  startedAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  affectedComponents: IncidentComponentRef[];
  updates: IncidentUpdate[];
}

export interface OverallStatus {
  status: ComponentStatus;
  label: string;
  message: string | null;
}

export interface StatusPayload {
  schemaVersion: string;
  page: StatusPageIdentity;
  overall: OverallStatus;
  components: StatusComponent[];
  activeIncidents: StatusIncident[];
  incidentHistory: StatusIncident[];
  generatedAt: string;
}
