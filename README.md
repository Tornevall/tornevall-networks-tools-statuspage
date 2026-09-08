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

The production bundle is written to `dist/`. Asset paths are relative by default, so the same build can be served from a subdirectory or from a dedicated hostname root.

## Runtime configuration

The app loads `status-config.json` from the same location as the built application. The repository ships with a default ToolsAPI deployment configuration:

```json
{
  "apiBaseUrl": "https://tools.tornevall.net",
  "pageSlug": "tools",
  "pathSlugPrefix": "/status",
  "refreshIntervalSeconds": 30,
  "titleOverride": "Tornevall Networks Tools"
}
```

Replace that file at deployment time for another compatible status page. `public/status-config.example.json` contains a neutral example.

`apiBaseUrl` may be empty when the public API is served from the same origin.

`pageSlug` is the default page to load. When `pathSlugPrefix` is set, a valid single slug immediately below that path overrides the default for the current request. For example, with `"pathSlugPrefix": "/status"`, `/status/example-company` loads `example-company` while `/status/` keeps the configured default page. Only lowercase alphanumeric slugs with internal hyphens are accepted; nested or malformed path content is ignored and the configured default remains in use.

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

## Production bundle branch

Source development stays on `main`; generated `dist/` files are not committed back to source branches. After a successful push to `main`, Statuspage CI runs tests, type checking and a Tools production build, validates the resulting bundle and publishes only that static output to the linear `production` branch.

The `production` branch also contains `SOURCE.json` with the source repository, exact source revision and component version. It contains no TypeScript/Vite source, `node_modules`, credentials or private backend configuration.

For ToolsAPI, the canonical public application route is `/status`, but the physical static bundle is deliberately mounted elsewhere. The CI-managed Tools production bundle is built with:

```bash
VITE_BASE_PATH=/status-client/ npm run build
```

ToolsAPI mounts that verified `production` commit at `public/status-client` and lets Laravel serve the React shell on `/status` and `/status/{slug}`. This separation prevents a physical web-root directory named `status` from intercepting the canonical Laravel route on nginx or similar front-controller setups.

Do not add `public/status/index.php`, `.htaccess` workarounds, or mount the production bundle at a physical `public/status` path in ToolsAPI.

## Asset base versus application route

The Vite asset base and the public application route are intentionally separate concerns:

- static files and runtime config: `/status-client/...`
- public application route: `/status`
- tenant application routes: `/status/{slug}`
- pathname tenant selection: `"pathSlugPrefix": "/status"`

The runtime `status-config.json` is loaded relative to the configured Vite base, while pathname tenant selection still uses the canonical public route prefix.

For other deployments, a different fixed Vite base can still be supplied:

```bash
VITE_BASE_PATH=/my-static-status-client/ npm run build
```

## Repository workflow

See `AGENTS.md` before making changes. Feature work should have an issue, branch, tests, and pull request.
