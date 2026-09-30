# dlc-appointments-portal

> Appointments bounded context — web UI remote.

Frontend portal for appointment management in the **Di Lucca Dental Care & Technology** distributed system.

Project governance, architecture, requirements, contracts, and technical documentation are maintained in [`code-corhuila/dlc-docs`](https://github.com/code-corhuila/dlc-docs).

## Technology stack

- Angular 21
- Node.js 22
- TypeScript strict mode
- Native Federation
- RxJS
- Zoneless Angular

## Architecture

`dlc-appointments-portal` is the Appointments domain micro-frontend.

It is published as an Angular Native Federation remote and exposes:

```text
./Routes -> src/app/appointments/appointments.routes.ts
```

`dlc-front` mounts the remote and owns the shared frontend infrastructure.

### Shell integration

`dlc-front` owns authentication, session state, the shared Angular `HttpClient`, authentication interceptors, gateway location, authorization headers, correlation identifiers, and common HTTP error handling.

This portal must not call `provideHttpClient()`, create authentication interceptors, manage or decode JWTs, store authentication credentials, or define gateway hosts or absolute API URLs.

API requests must use the shell-provided `HttpClient` and relative `/api/v1/...` routes.

The canonical typed shell contract is not available yet. `src/app/shell-contract.ts` remains a provisional compile-time boundary and must be replaced when `dlc-front` publishes the authoritative contract.

## Current scope

The repository currently provides Angular bootstrap, Native Federation configuration, strict TypeScript, zoneless execution, the Appointments route boundary, and the provisional shell integration boundary.

Business use cases are implemented in later feature Pull Requests.

## Install and run

Node.js 22 is required.

```bash
npm ci
npm start
npm run build
```

The development server uses port `4200`. Build artifacts are generated under `dist/`.

## Security

Never commit passwords, tokens, private keys, certificates, or `.env` files.

Authentication credentials and session state belong to `dlc-front`; this portal must not persist them in browser storage.

## Repository ownership

This repository owns only the Appointments web interface. Backend business rules, persistence, database migrations, gateway configuration, and shared authentication infrastructure belong to their corresponding repositories.

## Branching

Permanent branches do not accept direct commits.

```text
develop  <--PR--  feat/... fix/... chore/...
qa       <--PR--  qa/...
main     <--PR--  release/... hotfix/...
```

Promotion between environments uses re-application with `git cherry-pick -x`. Permanent branches are never merged directly into each other.

For the complete policy, see `00-governance/branching-policy.md` in `dlc-docs`.
