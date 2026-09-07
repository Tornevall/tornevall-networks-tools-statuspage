# Agent Coding Guide - Tornevall Networks Tools Statuspage

## Purpose

This repository contains the standalone public status-page application for the ToolsAPI Status Platform.

The application must be independently installable and hostable anywhere static web assets can be served. It must not require the ToolsAPI Laravel application, Blade templates, or a shared filesystem at runtime.

## Architecture

- Frontend: React + Vite + TypeScript.
- Backend: none in this repository.
- Data source: a configurable ToolsAPI-compatible public status API endpoint.
- The frontend is a read-only public client. Status management, monitoring, incidents, tenant ownership, authorization, subscriptions, audit logging, and AI generation belong to the backend platform.
- Runtime configuration must support different status API base URLs and page identifiers without rebuilding application source code where practical.
- `main` is source-only. Never mount the Vite/TypeScript `main` checkout as a production document root.
- The CI-managed `production` branch contains only the verified static bundle built from `main` with `VITE_BASE_PATH=/status/`, plus safe source revision/version metadata. ToolsAPI may pin that production commit directly at its public `/status` mount without requiring Node/npm on the Tools host.
- Production-branch history must remain linear so downstream pinned deployment commits stay reachable. Do not force-replace deployment history.

## Security and rendering

- Treat all API-provided text as untrusted.
- Do not render raw HTML from API responses.
- Do not introduce `dangerouslySetInnerHTML` for remote status, incident, service, or branding content.
- External links must be validated and rendered safely.
- Never store backend API secrets, private tokens, credentials, or administrative endpoints in this public application.
- The `production` branch must never contain TypeScript/Vite source, `node_modules`, credentials or private configuration. `SOURCE.json` may contain only the public repository identity, source revision and component version.

## Product requirements

- The app must support overall status, component/service status, active incidents, incident history, uptime/history presentation, and automatic refresh.
- It must have a useful degraded/offline state when the configured status API cannot be reached.
- Branding and page identity must be configurable so the same build can serve different installations.
- Keep the UI responsive and accessible. Status must never be communicated by color alone.
- The public client must remain generic. Do not special-case ToolsAPI or Tornevall services in reusable components.
- A deployment may configure `pathSlugPrefix` so one bundle serves tenant routes such as `/status/{slug}`. Only a validated single slug below that configured prefix may override the configured default `pageSlug`; malformed or nested path content must fail closed to the default.

## API compatibility

- Keep public API types and normalization centralized.
- ToolsAPI API and route URLs are unversioned. Never introduce `/v1`, `/v2`, or similar version namespaces in status API URLs.
- Backwards-incompatible API assumptions require an explicit contract and documentation update without URL versioning.
- Unknown status values from newer backends must degrade safely instead of crashing the app.

## Testing and CI

- All material changes require relevant automated tests.
- Component behavior, API parsing/error handling, status rendering, configuration behavior and pathname slug selection should have regression tests where practical.
- Pull requests must run install, tests, type checking, production build and static bundle-contract validation.
- A successful push to `main` may publish the already-verified bundle to `production` only after the test job passes. Publishing failures are release/deployment failures and must not be hidden.

## Documentation and releases

- Keep `README.md` current with installation, configuration, build, hosting, and API-contract requirements.
- Keep `CHANGELOG.md` current for user-visible and integration-visible changes.
- Keep the component version in `package.json` aligned with released client changes.
- Never document secrets or real credentials.

## Repository workflow

- Before making changes, inspect existing implementation, issues, pull requests, and every applicable `AGENTS.md`.
- Reuse existing issues, branches, and pull requests when appropriate; do not create duplicates.
- Development work should use an issue, branch, tests, and pull request.
- Preserve backwards compatibility unless a breaking change is explicitly intended and documented.
