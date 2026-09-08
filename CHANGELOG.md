# Changelog

## 0.1.3 - 2026-09-08

- Decouple the Tools production asset base from the canonical `/status` application route by building the CI-managed bundle for `/status-client/` while keeping pathname tenant selection on `/status`.
- Prevent nginx/front-controller deployments from treating a physical `public/status` directory as the public application route before Laravel can serve the SPA shell.
- Keep the generated production bundle source-free, linearly published and suitable for pinning at ToolsAPI `public/status-client` without Node/npm on the production host.
- Strengthen CI bundle checks so Tools production artifacts require `/status-client/assets/`, reject `/status/assets/`, and preserve `pathSlugPrefix: /status`.

## 0.1.2 - 2026-09-07

- Add a CI-managed `production` branch containing only the verified static bundle built from `main` with the canonical `/status/` asset base.
- Publish only after tests, type checking, production build and bundle-contract checks pass.
- Record the source repository revision and component version in safe `SOURCE.json` metadata so downstream ToolsAPI deployments can pin the exact reviewed bundle.
- Keep production-branch history linear and keep generated `dist/` out of source branches.

## 0.1.1 - 2026-09-07

- Add an optional `pathSlugPrefix` runtime setting so one deployed bundle can serve canonical tenant URLs such as `/status/{slug}` while retaining the configured default page at `/status/`.
- Validate pathname-derived slugs before they can be used in the public API request; nested, malformed or unsupported path content falls back to the configured default page.
- Clarify that ToolsAPI should publish the generated `dist/` bundle from a source checkout outside the public web root rather than serving the Vite/TypeScript source checkout directly.
- Keep the first-party public API contract unversioned at `GET /api/statuspage/{slug}`.

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
