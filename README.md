# Tornevall Networks Tools Statuspage

Standalone public status-page frontend for the ToolsAPI Status Platform.

The application is intentionally backend-agnostic at runtime. It consumes the public ToolsAPI status contract and can be installed on any static hosting platform that can serve HTML, JavaScript, CSS, and a small runtime configuration file.

## Requirements

- Node.js 22 or newer for development/builds.
- A ToolsAPI-compatible public status endpoint.
- Static hosting such as Apache, Nginx, Cloudflare Pages, Netlify, GitHub Pages, object storage/CDN, or another static web server.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm install
npm run test
npm run typecheck
npm run build
```

The production bundle is written to `dist/`.

## Runtime configuration

The app loads `status-config.json` from the same base path as the application. Copy `public/status-config.example.json` to `public/status-config.json` before building, or provide an equivalent file next to the built assets.

Example:

```json
{
  "apiBaseUrl": "https://api.example.test",
  "pageSlug": "example-company",
  "refreshIntervalSeconds": 30,
  "titleOverride": null
}
```

`apiBaseUrl` may be empty when the public API is served from the same origin.

The client requests:

```text
GET {apiBaseUrl}/api/status/v1/pages/{pageSlug}
```

If the runtime configuration file is unavailable, the app falls back to build-time variables when present:

```text
VITE_STATUS_API_BASE_URL
VITE_STATUS_PAGE_SLUG
VITE_STATUS_REFRESH_INTERVAL_SECONDS
```

No private API token belongs in either configuration path. The frontend uses public read-only endpoints only.

## Public API contract

The frontend expects schema version `1.x` and safely normalizes unknown component/incident status values instead of crashing. The main payload contains:

- page identity and optional branding metadata;
- overall status;
- components/services and optional uptime values;
- active incidents and incident timeline updates;
- recent incident history;
- generation timestamp.

Remote text is rendered as text, not raw HTML.

## Hosting under a subdirectory

Set Vite's `base` using `VITE_BASE_PATH` when building:

```bash
VITE_BASE_PATH=/status/ npm run build
```

The runtime `status-config.json` is loaded relative to that base path.

## Repository workflow

See `AGENTS.md` before making changes. Feature work should have an issue, branch, tests, and pull request.
