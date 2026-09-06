# Tornevall Networks Tools Statuspage

Standalone public status-page frontend for the ToolsAPI Status Platform.

This is a separate React application. It does not use Laravel, Blade, the ToolsAPI frontend bundle, or a shared runtime with ToolsAPI. Its only runtime dependency is the public read-only ToolsAPI status endpoint.

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

The production bundle is written to `dist/`. Asset paths are relative by default, so the same build can be served from a subdirectory such as `/status/` or from a dedicated hostname root such as `status.example.test`.

## Runtime configuration

The app loads `status-config.json` from the same location as the built application. The repository ships with a default ToolsAPI deployment configuration:

```json
{
  "apiBaseUrl": "https://tools.tornevall.net",
  "pageSlug": "tools",
  "refreshIntervalSeconds": 30,
  "titleOverride": "Tornevall Networks Tools"
}
```

Replace that file at deployment time for another compatible status page. `public/status-config.example.json` contains a neutral example.

`apiBaseUrl` may be empty when the public API is served from the same origin.

The client requests the unversioned endpoint:

```text
GET {apiBaseUrl}/api/statuspage/{pageSlug}
```

If the runtime configuration file is unavailable, the app falls back to build-time variables when present:

```text
VITE_STATUS_API_BASE_URL
VITE_STATUS_PAGE_SLUG
VITE_STATUS_REFRESH_INTERVAL_SECONDS
```

No private API token belongs in either configuration path. The frontend uses public read-only endpoints only.

## Public API contract

The client accepts the ToolsAPI public Statuspage payload with these public fields:

- `slug`, `name`, `description`, `status`, and `published_at` for page identity/state;
- `components[]` with component identity, description, status, and ordering;
- `incidents[]` with title, status, impact, public summary, timestamps, and published updates;
- `events[]` when supplied by the backend.

The normalizer also tolerates optional richer presentation metadata such as status labels, branding, homepage links, and uptime summaries. Missing optional fields degrade to neutral display values instead of breaking rendering. Unknown future status values render as `Unknown`.

Remote text is rendered as text, not raw HTML.

## ToolsAPI checkout placement

The ToolsAPI repository can mount this repository as a Git submodule at:

```text
public/status
```

That path is only a checkout/deployment location. The React application remains independent from Laravel. A future `status.tornevall.net` virtual host can serve the built `dist/` directory directly without routing requests through ToolsAPI's web application.

## Custom base path

Relative assets are the default. A fixed Vite base can still be supplied when a deployment requires it:

```bash
VITE_BASE_PATH=/status/ npm run build
```

The runtime `status-config.json` is loaded relative to the configured base.

## Repository workflow

See `AGENTS.md` before making changes. Feature work should have an issue, branch, tests, and pull request.
