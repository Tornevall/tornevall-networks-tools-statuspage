# Changelog

## 0.1.0 - 2026-08-21

- Bootstrap the standalone React/Vite/TypeScript status-page application.
- Add runtime configuration for independently hosted installations, with the ToolsAPI `tools` page as the default deployment configuration.
- Consume the unversioned ToolsAPI public endpoint at `/api/statuspage/{slug}`.
- Normalize the ToolsAPI page, component, incident and published incident-update payload without requiring Laravel or Blade at runtime.
- Add overall status, component/service, incident and history presentation.
- Add automatic refresh, stale-data presentation and API-unavailable handling.
- Make production asset paths portable between `/status/` and a dedicated status hostname.
- Add SPA fallback routing so direct navigation and reloads resolve through the generated `dist/index.html` entry point.
- Treat `dist/` as generated deployment output instead of committing CI-generated bundles back to pull-request branches.
- Add tests and GitHub Actions validation for test, typecheck and production build output.
- Repair the initial CI typecheck configuration by separating Vite and Vitest configuration.
