
# DLC Appointments Portal — DI LUCCA

**Appointments domain frontend** for the **Di Lucca Dental Care & Technology** distributed system.

- **Repository:** [code-corhuila/dlc-appointments-portal](https://github.com/code-corhuila/dlc-appointments-portal)
- **Main frontend (shell):** [code-corhuila/dlc-front](https://github.com/code-corhuila/dlc-front)
- **Governance and API contracts:** [code-corhuila/dlc-docs](https://github.com/code-corhuila/dlc-docs)
- **Current scope:** Angular UI, demonstration workflows, and visual integration with `dlc-front`. **This is not a fully integrated production workflow.**

## 1. Technology stack

- Angular 21, strict TypeScript, and RxJS.
- Node.js 22 for local development and builds.
- Zoneless Angular.
- Native Federation configuration for the existing standalone/federated workflow.
- ES module (`entry.js`) for composition within `dlc-front`.
- Docker Compose and Nginx for serving the composed portal.
- Angular test scripts backed by Vitest.

## 2. Architecture and execution modes

This repository owns **only the Appointments domain user interface**. Persistence, domain services, IAM, and the gateway belong to their respective repositories.

### Standalone mode

Start the portal with `npm start` using the existing Angular and Native Federation setup. The federated remote exposes:

```text
./Routes -> src/app/appointments/appointments.routes.ts
```

### Composed mode in `dlc-front`

The `dlc-front` shell controls global navigation and dynamically loads:

```text
/portals/appointments/0.1.0-demo/entry.js
/portals/appointments/0.1.0-demo/entry.css
```

`src/entry.ts` exports `portalId = 'appointments'`, `contractVersion = 1`, and `mount(host, context)`. Its lifecycle also supports `updateRoute()`, `canLeave()`, and `unmount()`. Importing `entry.js` **must not automatically mount** the Angular application.

| Screen | Route in `dlc-front` | Local portal route |
| --- | --- | --- |
| Appointments / Calendar | `/app/appointments/calendar` | `/calendar` |
| Availability and Slots | `/app/appointments/availability` | `/availability` |
| New Appointment | `/app/appointments/new` | `/new` |
| My Calendar | `/app/appointments/my-calendar` | `/my-calendar` |
| Clinical Assignments | `/app/appointments/clinical-assignments` | `/clinical-assignments` |
| Access Denied | `/app/appointments/forbidden` | `/forbidden` |

Unknown routes display a 404 view. In composed mode, navigation should go through the shell instead of directly changing browser history.

**Current limitation:** the composed demonstration uses synthetic data and local providers. Real service integration through `context.http`, session identity through `context.session`, full CSS isolation, and end-to-end acceptance are not yet verified or implemented. Do not assume the Angular `HttpClient` is already connected to the shell's transport.

## 3. Prerequisites

- Git.
- **Node.js 22** and npm.
- Docker Desktop or Docker Engine with Docker Compose for the container demonstration.
- Available local ports: `4200` for Angular, `4177` for the Appointments container, and `8080` for `dlc-front`.
- A separate checkout of `dlc-front` for the composed integration test.

Unless otherwise stated, run the commands below from the **root of `dlc-appointments-portal`**. Windows CMD is used in the examples; most commands also work in PowerShell.

## 4. Install and run locally

Install dependencies exactly as specified in the lockfile:

```cmd
npm ci
```

Start the standalone Angular development server:

```cmd
npm start
```

Open `http://localhost:4200`. This mode is useful when developing UI screens without starting `dlc-front`.

Build the existing standalone application:

```cmd
npm run build
```

Build artifacts are written under `dist/` (the exact subdirectory depends on the Angular configuration).

## 5. Tests and build verification

Run the complete automated test suite once, without watch mode:

```cmd
npm test -- --watch=false
```

Check the regular Angular production build:

```cmd
npm run build
```

Build the standalone ES module consumed by the shell:

```cmd
npm run build:entry
```

Verify the generated entry module:

```cmd
npm run verify:entry
```

The `build:entry` task produces:

```text
dist/site/portals/appointments/0.1.0-demo/
  entry.js
  entry.css
```

`entry.css` may be **0 bytes** when Angular bundles component styles in JavaScript. This alone does not indicate a styling problem: verify the rendered UI inside `dlc-front`.

**How to interpret the results:** passing unit tests or building successfully **does not** establish real persistence, authorization, backend compatibility, or end-to-end operation. Node's `ExperimentalWarning: VM Modules` was non-blocking in the previously reported ESM verification runs.

### Historical validation evidence

| Date / milestone | Reported result | Scope and limitation |
| --- | --- | --- |
| 2026-10-09 — HU-APT-001 frontend closure | **169/169** tests across 30 test files; successful build | Availability and scheduling with test doubles, not a real backend E2E test. |
| 2026-10-09 to 2026-10-10 — HU-APT-002/003/004 demo work | **217/217** tests; successful build | Appointment actions, personal calendar, and demo assignments. |
| 2026-10-11 — composition, ES build, and Docker | **238/238** tests; successful builds | Latest full suite reported during the composition increments. |
| 2026-10-11 — static delivery and proxy | `entry.js` returned **HTTP 200**, JavaScript MIME type, and `Cache-Control: no-store` via `:4177` and `:8080` | Static delivery verification, not an end-to-end backend test. |

These totals are from **different historical runs**, not a single current test execution. Always rerun the checks against the commit being delivered.

## 6. Start the Appointments Docker container

From this repository's root:

```cmd
docker compose -f deploy/compose.yml up -d --build appointments-portal-demo
```

The `appointments-portal-demo` service maps host port **4177** to Nginx port **80** in the container and connects to the shared Docker network named `dlc-front`.

Check the published assets:

```cmd
curl.exe -I http://localhost:4177/portals/appointments/0.1.0-demo/entry.js
curl.exe -I http://localhost:4177/portals/appointments/0.1.0-demo/entry.css
```

Expected behavior: **HTTP 200** for existing assets, appropriate MIME types, and `Cache-Control: no-store`. Missing resources under `/portals/` must return **404** instead of falling back to `index.html`.

List running containers and published ports:

```cmd
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

Stop only the Appointments demo service:

```cmd
docker compose -f deploy/compose.yml stop appointments-portal-demo
```

Start that existing container again:

```cmd
docker compose -f deploy/compose.yml start appointments-portal-demo
```

Avoid `docker compose down` during the availability demonstration; it may remove project-managed networks and other services.

## 7. Run and test the integration with `dlc-front`

Run this section **from the root of the separate `dlc-front` repository**, with its `develop` branch updated to include the Appointments integration:

```cmd
docker compose -f deploy/compose.yml up -d --build dlc-front
```

The shell is available at `http://localhost:8080` and proxies the Appointments assets to `appointments-portal-demo:80` through the shared `dlc-front` Docker network.

Verify the proxy before opening the UI:

```cmd
curl.exe -I http://localhost:8080/portals/appointments/0.1.0-demo/entry.js
```

Then test the following routes in your browser:

- [Appointments — Calendar](http://localhost:8080/app/appointments/calendar)
- [Availability and Slots](http://localhost:8080/app/appointments/availability)

**Availability demonstration:** first confirm that both screens render within the `dlc-front` shell and retain its sidebar. Next, stop **only** `appointments-portal-demo` and verify that the shell displays its unavailable-section state. Restart the Appointments container and confirm recovery. Sidebar links may remain visible while the remote portal is down.

**Clinical network dependency:** the current `dlc-front` Compose configuration also refers to the external `dlc-clinical-portal_default` network. If it is missing, inspect `docker network ls` and the Clinical deployment configuration. For an isolated local demo, an empty external network can be created using `docker network create dlc-clinical-portal_default`; **this does not start Clinical or establish that Clinical works**. A real Clinical deployment must be configured separately.

### Troubleshooting

| Symptom | What to check |
| --- | --- |
| Port `8080` is already allocated | Run `docker ps` and identify its owner; do not stop unrelated containers without checking. |
| The module responds on `4177` but not on `8080` | Check the `dlc-front` container, the shared network, and the Nginx proxy configuration. |
| The Clinical external network is missing | Check Docker networks and the corresponding Clinical deployment. |
| `entry.js` returns 404 | Run `npm run build:entry`, rebuild the image, and confirm the `0.1.0-demo` asset path. |
| JavaScript returns 200 but the UI stays blank | Inspect the browser console, `src/entry.ts` mounting behavior, and shell/portal routing. |
| Angular reports a CSS budget warning | Historical Calendar/Scheduling CSS warnings were non-blocking; do not assume they caused a runtime failure. |

## 8. Git workflow: create a branch from `develop`

**Do not commit directly to permanent branches** (`develop`, `qa`, or `main`). Documentation updates, including this README, use a short-lived branch and a Pull Request.

Check local changes and update your branch first:

```cmd
git status -sb
git fetch origin
git switch develop
git pull --ff-only origin develop
```

Create a documentation branch (choose an available name):

```cmd
git switch -c docs/appointments-readme-guide
```

Edit **only `README.md`**, save it, and inspect the changes:

```cmd
git diff -- README.md
git status -sb
```

Stage only the README and check the staged diff:

```cmd
git add -- README.md
git diff --cached --stat
git diff --cached --check
```

Do not run `git add .` indiscriminately. **Each PR must stay within the 400 added-plus-deleted-lines limit.** Check the actual diff; if this documentation change is too large, split it across smaller PRs.

Commit and push the documentation branch:

```cmd
git commit -m "docs(appointments): document setup tests docker and git workflow"
git push -u origin docs/appointments-readme-guide
```

Open a Pull Request in the [Appointments repository](https://github.com/code-corhuila/dlc-appointments-portal), selecting **base `develop`** and **compare `docs/appointments-readme-guide`**. Wait for CI checks and review before merging.

After the PR is merged, update the local checkout:

```cmd
git fetch origin
git switch develop
git pull --ff-only origin develop
```

### Commit conventions and environment promotion

- Use descriptive commits, such as `feat(appointments): ...`, `fix(composition): ...`, `test(appointments): ...`, and `docs(appointments): ...`.
- Before opening a PR, run relevant tests, inspect `git diff`, check its size, and record evidence.
- If the PR template or CI requires it, include `User story`, `What changed and why`, `How it was tested`, `Evidence`, and `Known limitations`, along with the appropriate issue or user-story reference.
- **QA promotion, only when explicitly approved:** create a branch from the current `qa` branch and reapply the approved implementation commit using `git cherry-pick -x <commit-sha>`. Open a PR targeting `qa`. Never merge `develop` directly into `qa`.
- Before staging, review any existing `.gitignore` changes, `AGENTS.md`, temporary files, and generated `dist/` artifacts. Do not include them by accident.

See the official [branching policy](https://github.com/code-corhuila/dlc-docs/blob/main/00-governance/branching-policy.md).

## 9. Demonstration features and limitations

The frontend includes an administrative calendar, availability and slots, appointment scheduling, appointment lifecycle actions, a dentist's personal calendar, and demonstration clinical assignments. Some flows use Angular services structured around API contracts; others use synthetic data and local state/providers.

**A working demonstration is not the same as functional acceptance.** Real IAM, roles, patients, persistence, conflicts, domain events, and backend service integration still need implementation or validation under their respective user stories.

Related documentation:

- [Approved user stories and requirements](https://github.com/code-corhuila/dlc-docs/blob/main/04-requirements/user-stories.md)
- [HU-APT-004 / integration — Issue #69](https://github.com/code-corhuila/dlc-docs/issues/69)
- [Documentation repository](https://github.com/code-corhuila/dlc-docs)

## 10. Security and repository boundaries

Never commit passwords, tokens, private keys, certificates, or `.env` files. Authentication, identity, and authorization belong to the shell and the owning services; demonstration roles and profiles **do not grant real permissions**.

This frontend must not duplicate the gateway, manage JWT credentials, or implement backend persistence rules. Check current authoritative architecture decisions and API contracts before implementing production integrations.

## Branching

Permanent branches do not accept direct commits.

```text
develop  <--PR--  feat/... fix/... chore/...
qa       <--PR--  qa/...
main     <--PR--  release/... hotfix/...
```

Promotion between environments uses re-application with `git cherry-pick -x`. Permanent branches are never merged directly into each other.

For the complete policy, see `00-governance/branching-policy.md` in `dlc-docs`.