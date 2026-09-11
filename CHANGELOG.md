# Changelog

## 0.1.4 - 2026-09-11

- Separate page/canvas colors from card/surface colors so status content no longer inherits light-on-dark text when displayed on light status cards.
- Keep the dark-mode outer canvas while using high-contrast light cards with dark headings, component text, metadata and status colors.
- Add a focused theme regression test to preserve the dark-canvas/light-surface contrast contract.
- Repair the theme regression test path resolution so CI can complete the verified 0.1.4 production build and publish the corrected bundle.

## 0.1.3 - 2026-09-08

- Decouple the Tools production asset base from the canonical `/status` application route by building the CI-managed bundle for `/status-client/` while keeping pathname tenant selection on `/status`.
- Prevent nginx/front-controller deployments from treating a physical `public/status` directory as the public application route before Laravel can serve the SPA shell.
- Keep the generated production bundle source-free, linearly published and suitable for pinning at ToolsAPI `public/status-client` without Node/npm on the production host.
- Strengthen CI bundle checks so Tools production artifacts require `/status-client/assets/`, reject `/status/assets/`, and preserve `pathSlugPrefix: /status`.

## 0.1.2 - 2026-09-07

- Add a CI-managed `production` branch containing only the verified static bundle built from `main` with the canonical `/status/` asset base.
- Publish only after tests, type checking, production build and bundle-contract checks pass.
- Record the source repository revision and component version in safe `SOURCE.json` metadata so downstream ToolsAPI deployments can pin the exact reviewed bundle.
