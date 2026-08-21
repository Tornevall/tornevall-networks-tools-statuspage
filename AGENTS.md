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

## Security and rendering

- Treat all API-provided text as untrusted.
- Do not render raw HTML from API responses.
- Do not introduce `dangerouslySetInnerHTML` for remote status, incident, service, or branding content.
- External links must be validated and rendered safely.
- Never store backend API secrets, private tokens, credentials, or administrative endpoints in this public application.

## Product requirements

- The app must support overall status, component/service status, active incidents, incident history, uptime/history presentation, and automatic refresh.
- It must have a useful degraded/offline state when the configured status API cannot be reached.
- Branding and page identity must be configurable so the same build can serve different installations.
- Keep the UI responsive and accessible. Status must never be communicated by color alone.
- The public client must remain generic. Do not special-case ToolsAPI or Tornevall services in reusable components.

## API compatibility

- Keep public API types centralized and version-aware.
- Backwards-incompatible API assumptions require an explicit contract/version change and documentation update.
- Unknown status values from newer backends must degrade safely instead of crashing the app.

## Testing and CI

- All material changes require relevant automated tests.
- Component behavior, API parsing/error handling, status rendering, and configuration behavior should have regression tests where practical.
- GitHub Actions must run install, tests, type checking, and production build for pull requests.

## Documentation and releases

- Keep `README.md` current with installation, configuration, build, hosting, and API-contract requirements.
- Keep `CHANGELOG.md` current for user-visible and integration-visible changes.
- Never document secrets or real credentials.

## Repository workflow

- Before making changes, inspect existing implementation, issues, pull requests, and every applicable `AGENTS.md`.
- Reuse existing issues, branches, and pull requests when appropriate; do not create duplicates.
- Development work should use an issue, feature branch, tests, and pull request.
- Preserve backwards compatibility unless a breaking change is explicitly intended and documented.
