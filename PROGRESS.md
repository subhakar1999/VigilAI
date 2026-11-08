# VigilAI Implementation Progress

Last updated: 2026-11-08

## Maintenance rule

Update this document whenever implementation work changes feature status, verification results, architectural decisions, known limitations, or next steps. Update `FILE_CHANGES.md` in the same change set when files are added, removed, renamed, or materially modified.

## Overall status

The initial end-to-end platform implementation is complete and locally verified. The scanner, control plane, visual console, and dynamic red-team worker share compatible data contracts and can be run together through Docker Compose.

| Area | Status | Current result |
| --- | --- | --- |
| Scanner CLI | Complete | Model, Python AST, and MCP scanning with SARIF/AIBOM output and onboarding. |
| Control plane | Complete | Persistent workload/scan/pentest, project, team, and membership records with deterministic quality gates. |
| Console | Complete | Responsive fleet, project, team, evidence, and interactive workflow views. |
| Red-team worker | Complete | Deterministic IPI, exfiltration, and tool-hijacking assessment flow. |
| Tests | Passing | Core unit, contract, queue, and integration tests pass. |
| Console validation | Passing | Strict TypeScript check and production build passed. |
| Dependency audit | Passing | npm reported zero vulnerabilities. |
| Container configuration | Passing | `docker compose config --quiet` completed successfully. |
| Product namespace | Complete | Source paths, imports, commands, configuration, tests, and documentation use VigilAI consistently. |
| Local runtime | Stopped | The Compose services and local AI example service were stopped on 2026-11-08. |
| Endpoint onboarding | Complete | Portal and CLI accept a URL directly and derive reachability, OpenAPI operations, topology, and AIBOM metadata. |
| Failure evidence | Complete | Failed workload pages explain gate reasons and display persisted static and red-team evidence. |
| Project/team governance | Complete | Projects aggregate workload gates and risks; teams manage members, roles, ownership, and repository metadata. |
| Console authentication | Complete | Environment credentials, signed HTTP-only sessions, login redirect, and logout protect portal routes. |
| Record removal | Complete | Confirmed scan/workload cascade deletion and explicit team-member removal are available in the portal. |
| Test-agent laboratory | Complete | Four model-free profiles provide deterministic passing and failing dynamic-assessment cases. |

## Completed work

### 2026-11-08 — Unused-code audit

- Removed an unused control-plane schema import. Strict TypeScript unused-symbol checks and a structural audit of Python imports found no other unused imports in application source.
- Kept referenced app components, Next.js icon assets, launchers, and existing user-owned files. No user files or data were removed.
- Verification: all 26 Python tests and the strict TypeScript unused-symbol check passed. The temporary test directory was removed after the run.

### 2026-11-08 — One-command local shutdown

- Stopped the console, API, worker, test agents and temporary local AI example service without removing persistent data. No Ollama model was loaded when checked; the separately managed Ollama service was left running.
- Added `Stop-Local.cmd` to stop the complete Compose stack and the project-specific AI example process. The example launcher now includes its project directory in its command line, so shutdown can leave unrelated services alone.
- Verified the command against a real example process and stopped containers, then used isolated mocks to confirm that an unrelated process is not stopped. The PowerShell syntax check passed.

### 2026-11-08 — Real local AI examples

- Added three local examples backed by Ollama: direct model chat, a model-selected read-only order tool, and a two-stage model workflow. Their HTTP responses contain observed model-request and tool traces for the existing red-team contract. The examples fail if Ollama is unavailable rather than simulating a response.
- The installed `gpt-oss:20b` model was exercised with all three endpoints; the agent executed its read-only sample tool and the workflow made two actual model calls. A single existing indirect-prompt probe ran against each example with zero forbidden tool/network observations. These assertions do not assess answer content and are not proof of model safety. Ollama GGUF weights are outside the pickle scanner's coverage.
- Added a Windows launcher, isolated example dependencies, endpoint instructions and configurable worker/lease timeouts. Model choice and timing depend on the machine; test services remain local-only.
- Verification: all 26 Python tests passed; Compose configuration and PowerShell syntax passed. The launcher created the ignored `.venv-examples` environment, installed its dependencies, and successfully served a real agent request. The temporary example service was stopped after testing; the VigilAI stack remains stopped.

### 2026-11-08 — One-command local startup

- Added `Start-Local.cmd` and its PowerShell implementation to start the console, API, worker, and test-agent services together. On first use it creates a private ignored `.env` with generated credentials; an existing `.env` is never overwritten.
- The launcher checks Docker and required configuration, reports failures, and documents where to find local credentials. Docker Desktop remains a prerequisite; the scanner CLI remains optional.
- Verification passed for PowerShell syntax, first-run generated credentials, unchanged existing configuration, and the complete Compose command using a simulated Docker executable. Compose configuration validation also passed; services were not started for this check.

### 2026-11-03 — Cleanup and Vercel guidance

- Removed unused TypeScript imports, unused simulation request fields, and an unused public API URL build setting; retained referenced features and user-owned files. Strict unused-symbol checking passes.
- Replaced the README with a beginner-oriented setup, local fixture, CLI, testing and Vercel console deployment guide. The guide explains the separate API, persistent storage and worker requirements and the present security limitations.
- Updated the portal origin validation to accept matching local origins or an explicitly configured `VIGILAI_PUBLIC_ORIGIN` for hosted deployments, with tests for allowed and rejected origins. The previously observed localhost mutation failure has not yet been verified against the running containers.
- Verification: 23 Python tests, 4 console auth/origin tests, strict TypeScript unused-symbol check, console production build, and Compose configuration validation passed. The services were not restarted.

### 2026-11-03 — Runtime stopped and sign-in inspection

- Stopped the console, control plane, red-team worker and test-agent containers while retaining their persistent data.
- Inspected the login flow and recent console logs. The prior HTTP login check succeeded, and the logs do not identify a cause for the reported slow browser sign-in. The form has no request timeout and keeps its loading state during navigation; a live browser investigation is still needed to establish the cause.

### 2026-11-03 — End-to-end exercise

- Started the Compose server, console, red-team worker and test-agent profiles; added a random API token to the ignored local `.env` without recording its value.
- Login, the fleet page and API authentication responded successfully. Two new test workloads were onboarded and queued directly through the authenticated API: the safe fixture recorded 0/5 exploits and an inconclusive gate (no source scan), and the shell fixture recorded 1/5 exploits and a failed gate with remediation visible on its dashboard page. An additional `Origin check` workload was created during diagnosis. These records were retained for inspection.
- Portal mutation requests from `http://localhost:3000` return HTTP 403 `Invalid request origin`, while the internally addressed `http://0.0.0.0:3000` origin is accepted. The browser onboarding and other POST/DELETE actions therefore need a proxy origin validation fix before full end-to-end portal testing can pass.

### 2026-11-03 — Security hardening toward tenant isolation

- Removed hard-coded fallback login credentials and signing secrets; missing environment configuration fails closed. Added regression tests for configured credentials and rejected fallback passwords.
- Compose now requires a separately configured API token and publishes the control-plane port to loopback only. An opt-in Kubernetes NetworkPolicy provides restricted egress for labelled server and worker pods; it requires a supporting CNI and deployment-specific review and has not been tested in a cluster.
- Both login regression tests and the console production build passed; Compose configuration validated with a temporary test token and the policy YAML parsed. The local Docker engine was unavailable for runtime verification.
- Tenant isolation, per-user login and enforced roles are **not implemented**. Existing workloads, projects and teams have no tenant ownership, so their migration requires an explicit ownership decision before they can be safely partitioned. Shared token and login must not be represented as multi-tenant security.

### 2026-11-03 — Assessment reliability and API access

- Endpoint-only discovery and incomplete dynamic evidence now show INCONCLUSIVE (`UNKNOWN` in the API); blocking evidence still takes precedence. Failed queued assessments retain their error, existing records are re-evaluated on read, and the UI explains missing coverage.
- Control-plane API operations require a configured bearer token. Signed-in browser requests use a same-origin server-side proxy; the CLI and worker use the environment token. Discovery and the worker require explicitly allowed endpoint hosts, and the public playground is simulation-only.
- Python tests, console type checking, production build, and Compose configuration validation passed. The Docker engine was unavailable for integrated live verification. Hostname allowlisting requires deployment-level egress/DNS controls; shared tokens and shared console login do not provide tenant isolation or per-user roles.

### 2026-11-03 — Finding remediation and landing-page follow-up

- Workload details display all static findings with stored remediation or an explicitly advisory fallback, plus evidence-specific guidance and OWASP references for failed tool and network episodes. The unrelated sample patch was removed from the actual failure view; guidance requires review and retesting.
- The public landing page at `/` and protected fleet at `/console` use the landing-page structure informed by Muzli's landing-page and SaaS collections. The Sites skill guided the local implementation.
- Console TypeScript validation and production build passed, as did Compose configuration validation. Live Docker verification was unavailable because the Docker Desktop Linux engine was not running.

### Phase 1 — Scanner sensor

- Implemented non-executing pickle inspection for `.pt`, `.bin`, `.pkl`, `.pickle`, and `.joblib` files.
- Added PyTorch ZIP archive pickle discovery.
- Enforced a strict tensor-related global allowlist.
- Added extension opcode and mutable `copyreg` detection.
- Added fail-closed malformed/ambiguous pickle handling for EDP-1-style parser bypasses.
- Implemented `@tool` and `@mcp.tool` argument taint sources.
- Implemented LLM-return taint sources and intra-procedural/one-hop propagation.
- Added dangerous sink, unbounded loop, and destructive-tool guard checks.
- Added workflow node and tainted-edge extraction.
- Implemented MCP tool description poisoning and cross-server shadowing checks.
- Implemented deterministic `.mcp-lock.json` generation.
- Implemented SARIF 2.1.0 and CycloneDX 1.6 AIBOM emitters.
- Implemented `vigilai scan`, `vigilai mcp-lock`, and `vigilai onboard`.

### Phase 2 — Control plane

- Implemented SQLModel models for workloads, scans, and pentest runs.
- Implemented SQLite-by-default configuration with environment-based database selection.
- Implemented scan submission and workload inventory/detail endpoints.
- Implemented dynamic pentest callback processing and compromised-node updates.
- Implemented deterministic failures for critical/high findings, tainted dangerous sinks, and nonzero attack success rates.
- Added risk score calculation and MCP component counting.

### Phase 3 — Visual console

- Implemented the fleet inventory dashboard and quality-gate summaries.
- Implemented responsive workload tables and API-unavailable/empty states.
- Implemented React Flow topology visualization with category colors.
- Implemented animated red taint paths, controls, minimap, and node selection.
- Implemented a slide-over evidence/remediation drawer.
- Added standalone production builds and a multi-stage container.
- Upgraded from the specified Next.js 14 baseline to the patched Next.js 16 line after critical advisories were detected.

### Phase 4 — Dynamic assessment

- Implemented inert indirect prompt-injection, exfiltration, and tool-parameter-hijacking episodes.
- Implemented deterministic tool invocation and network destination assertions.
- Implemented attack success rate calculation.
- Implemented workload retrieval, target execution, and server callback submission.
- Implemented durable pentest triggers, idempotent queueing, worker leases, stale-lease recovery, failure reporting, and continuous polling.
- Added schema-aware probes derived from MCP tool definitions in the workload AIBOM.

### Operations and delivery

- Added Docker Compose for the server and console.
- Added GitHub Actions for Python tests, static scanning, SARIF upload, type checking, and console builds.
- Added local development instructions and workspace-local verification tooling.
- Completed a repository-wide namespace migration to VigilAI, including package directories, Python imports, CLI executables, environment variables, CI, containers, test markers, and documentation.

## Verification record

Executed on 2026-10-24:

| Check | Result |
| --- | --- |
| `python -m pytest` | `11 passed in 0.85s` after the core completion pass. |
| `npm run typecheck` | Passed with no TypeScript errors. |
| `npm run build` | Production build completed successfully. |
| `npm audit --audit-level=moderate` | `found 0 vulnerabilities` |
| `vigilai --help` | All three CLI commands registered successfully. |
| `vigilai scan packages/vigilai-scanner/tests` | Completed and produced valid SARIF 2.1.0. |
| `uv pip check` | All 39 installed Python packages compatible. |
| `docker compose config --quiet` | Configuration valid. |
| Workspace-wide case-insensitive namespace audit | No legacy identifiers found in source, generated content, or paths. |
| `vigilai scan . --fail-on-gate` | Passed with no security findings and emitted valid SARIF. |
| `docker compose --profile redteam build` | Server, console, and red-team worker images built successfully. |
| `docker compose --profile redteam ps -a` | Confirmed that no containers are running. |

## Required test coverage

- Unsafe pickle `__reduce__` exploit detection: passing.
- Tainted `@tool` input reaching `subprocess.run(shell=True)`: passing.
- Quality gate failure for a tainted dangerous sink: passing.
- Red-team bypass causing nonzero ASR and gate failure: passing.
- Full scan submission → pentest callback → compromised graph update: passing.

## Current limitations and next work

- Authentication, authorization, tenant isolation, and secrets management are not part of the supplied initial specification and remain future hardening work.
- PostgreSQL is supported through `VIGILAI_DATABASE_URL`, while the local Compose setup intentionally uses persistent SQLite for zero-configuration startup.
- Distributed queue backends and horizontal worker coordination beyond database row leasing can be added if deployment scale requires them.
- Runtime browser QA was not performed; the console was verified through strict type checking and a production build.
- Deployment to a hosted environment has not been requested or performed.

## External tooling decision

Agent Reach was not used because official SonarQube documentation supplied the needed product behavior without scraping. REA was used on the generated Next.js standalone artifact to statically verify the shipped route bundle. Evidence `ev_ee02768df28c39ccc7bb913a62b8ac6c905a7502045e05217c62ca2be5ae696a` parsed the selected fleet, projects, teams, workload, and server entry files with zero parse failures. This is shipped-artifact evidence only: the selected-source graph is partial and does not prove runtime execution.

## Latest update — 2026-10-24

The VigilAI namespace migration is complete and verified. All Python packages were reinstalled under their new distribution names, the `vigilai` CLI is registered, the console dependency tree was regenerated, all tests pass, the production console build succeeds, npm reports zero vulnerabilities, and no legacy product identifier remains anywhere in the workspace.

## Runtime update — 2026-10-24

Docker Desktop was started and `docker compose up --build -d` completed successfully. The API container is healthy at `http://localhost:8000`, its `/health` endpoint returned `{"status":"ok"}`, and the VigilAI console returned HTTP 200 at `http://localhost:3000`. Package-specific `.dockerignore` files were added after the initial build to keep future Docker contexts small and startup builds faster.

## Completion update — 2026-10-24

All requirements in `INSTRUCTIONS.md`, `repo-layout.md`, `System-design.md`, and the repository README are implemented. The final pass added typed scan contracts, durable dynamic-test scheduling, continuous worker polling, lease recovery and ownership checks, schema-aware tool probes, AIBOM export, dynamic-test actions, remediation copying, bounded/excluded scanning behavior, and enforcing CI quality gates. The full verification suite passes, all container images build, and the Compose stack is stopped as requested while its persistent data volume remains intact.

## Runtime monitoring — 2026-10-25

The complete Compose profile was started and observed with the API, console, and red-team worker active. During the observation window:

- The API remained healthy with zero container restarts.
- Health, workload inventory, API documentation, and console requests all returned HTTP 200.
- Local response latency remained between 10 ms and 40 ms.
- CPU remained near idle; memory stabilized near 76 MiB for the API, 41 MiB for the console, and 28 MiB for the worker.
- The worker polled the empty pentest queue normally and received HTTP 204 responses.
- Forty-three log lines were reviewed, including 17 queue polls, with zero error, exception, traceback, critical, or HTTP 5xx matches.
- The persistent database currently contains zero workloads, so no dynamic probes were executed.

The three services remain running after monitoring.

## Runtime shutdown — 2026-10-25

The API, console, and red-team worker containers were stopped and removed with `docker compose --profile redteam down`. The Compose network was removed, the persistent data volume was preserved, and a final status check confirmed that no VigilAI containers remain running.

## Runtime startup - 2026-10-26

Docker Desktop was started and the complete Compose profile was launched with `docker compose --profile redteam up -d`. Runtime validation confirmed:

- The API is healthy at `http://localhost:8000/health` with HTTP 200.
- The workload inventory at `http://localhost:8000/api/v1/workloads` returns HTTP 200.
- The console at `http://localhost:3000` returns HTTP 200.
- The API, console, and red-team worker are all running with zero container restarts.
- Recent startup logs contain no error, exception, traceback, fatal, or panic matches.

The three services remain running.

## Endpoint-only onboarding - 2026-10-26

The fleet portal now includes an **Add endpoint** workflow. A user can provide only an agent URL and an optional name; the control plane performs bounded read-only discovery, infers framework/name metadata, imports OpenAPI operations and request schemas, builds an API topology and CycloneDX AIBOM, persists the workload, and enables explicit queued pentesting. The CLI supports the same source-free flow with `vigilai onboard --server URL --endpoint URL`, while retaining source scanning when a path is supplied. Localhost endpoints are retried through `host.docker.internal` for Docker compatibility, cloud metadata targets and embedded credentials are rejected, response size is bounded, redirects are disabled, and discovery never sends prompts or triggers tools.

Verification completed with 14 passing Python tests, a successful strict TypeScript check, and a successful Next.js production build. The server and console images were rebuilt and restarted; runtime checks confirmed a healthy API, HTTP 200 from the portal, the published endpoint-onboarding API route, the rendered **Add endpoint** control, zero recent log errors, and no container restarts. Coverage includes OpenAPI extraction, endpoint topology generation, portal/API persistence, and Docker localhost translation.

## Runtime shutdown and repository publication - 2026-10-26

The API, console, and red-team worker were stopped and removed with `docker compose --profile redteam down`. The Compose network was removed, the persistent `vigilai-data` volume was retained, and `docker compose --profile redteam ps -a` confirmed no remaining application containers. The workspace was audited for credential patterns and published to `https://github.com/subhakar1999/VigilAI.git` on the `main` branch; the initial platform commit is `b5ba59f`. Generated artifacts, local environments, databases, scan output, and environment files remain excluded through `.gitignore`.

## Functional-test diagnosis - 2026-10-26

The complete Compose profile was restarted for functional testing and all three services are healthy. The workload named `test` shows a `FAILED` security gate because the intentionally vulnerable demo endpoint reported prohibited behavior in all three red-team episodes (`3/3`, ASR `100%`); this is the expected detection result rather than an application failure. The platform test suite passed all 14 tests when run with an isolated workspace temp directory and pytest cache disabled. An earlier rerun produced one setup error because Windows denied access to the default user temp/cache directories; no test assertion failed in that run.

## Dashboard failure evidence - 2026-10-26

Failed workload pages now include a **Why this quality gate failed** panel. The API recomputes deterministic gate reasons and attaches the latest persisted pentest logs, compromised nodes, and run timestamp. The console shows blocking static findings, failed episode names, violation messages, forbidden tool calls, forbidden network destinations, affected node IDs, and expandable raw traces. Existing pentest evidence is reconstructed from `PentestRun`, so the previously failed `test` workload displays all three original violations without rerunning the assessment.

Verification completed with 14 passing Python tests, a successful strict TypeScript check, a successful Next.js production build, rebuilt server/console images, a healthy API, and HTTP 200 from the evidence-enabled workload page. Runtime inspection confirmed the page rendered both the failure panel and raw-trace controls. The red-team worker restarted once while the server container was replaced and recovered through its configured restart policy.

## Repository link - 2026-10-26

The portal header GitHub icon now opens `https://github.com/subhakar1999/VigilAI` in a new tab with an accessible label and safe external-link relationship. The README clone command now references the same canonical repository instead of a placeholder URL. Strict TypeScript checking and the Next.js production build passed; the rebuilt console returned HTTP 200 and its rendered HTML contained both the canonical URL and the new-tab target.

## Runtime shutdown - 2026-10-26

The API, console, and red-team worker were stopped and removed with `docker compose --profile redteam down`. The Compose network was removed and the persistent `vigilai-data` volume was preserved.

## SaaS console redesign - 2026-10-26

SaaSFrame was selected from the supplied Create UI inspiration list because its library is centered on real SaaS product interfaces and directly catalogs the patterns VigilAI needs: dashboards, tables, details views, flowcharts, side panels, security/compliance, status indicators, data grids, and sidebar navigation. The console now uses a responsive workspace shell with mobile navigation, persistent desktop sidebar, local-control-plane status, canonical repository/documentation links, compact page context, bento posture metrics, and a searchable/filterable agent inventory. Workload details were reorganized into identity/actions, security metrics, failure evidence, and topology surfaces. Existing endpoint onboarding, AIBOM export, pentest actions, failure explanations, graph interaction, and repository links remain intact.

Strict TypeScript checking, the Next.js production build, and the console Docker image build all passed. The app remains stopped as requested; only the updated image was built for verification.

## SonarQube-inspired projects and teams - 2026-10-26

The control plane now persists teams, members, and projects. Teams support unique names, descriptions, member invitations, five governance roles, invitation status, member removal, and project counts. Projects support stable keys, descriptions, private/internal/public visibility, owning teams, source-provider and repository metadata, a named quality policy, and validated associations to scanned workloads. Project responses aggregate their quality status and highest workload risk from current workload records.

The portal now includes dedicated **Projects** and **Teams** navigation. Users can create projects and teams, select existing agent workloads, assign ownership, bind repository metadata, invite/remove members, and inspect aggregate posture directly in the UI. Roles are clearly identified as governance metadata rather than enforced authorization until authentication is implemented.

Verification completed with 15 passing Python/API tests, strict TypeScript validation, a successful Next.js production build containing dynamic `/projects` and `/teams` routes, valid Compose configuration, and successful updated server/console image builds. REA statically parsed five selected shipped entry/route files with zero parse failures under parent Evidence `ev_ee02768df28c39ccc7bb913a62b8ac6c905a7502045e05217c62ca2be5ae696a`; analysis was intentionally scoped and did not execute the application. The Docker stack remains stopped and its persistent data volume is preserved.

## Runtime startup after project/team implementation - 2026-10-26

The VigilAI server and console were started with `docker compose up -d`. The server is healthy with zero restarts, the console is running, and live checks returned HTTP 200 for `/health`, `/api/v1/projects`, `/api/v1/teams`, and the portal at `http://localhost:3000`. Recent startup logs contain no error signatures. The application remains running for interactive testing.

## VigilAI logo and console login - 2026-10-26

A new transparent VigilAI brand mark was generated with the built-in image-generation workflow and saved as `packages/vigilai-console/public/vigilai-logo.png`. Its protective aperture, subtle V silhouette, and three-node reasoning graph now identify the sidebar, login screen, favicon, and Apple touch icon.

The console now requires a server-side environment username and password. Login and logout route handlers issue and expire an eight-hour signed HTTP-only session cookie, while the Next.js request proxy redirects unauthenticated portal requests to `/login`. The signing secret and credentials live in the ignored root `.env`; `.env.example` documents the required variables without committing a real secret. This controls portal access only—the directly exposed FastAPI service still requires a gateway/authentication layer for public deployment.

Verification passed through all 15 Python/API tests, strict TypeScript validation, the Next.js production build, valid Compose configuration, and a rebuilt Docker environment. Runtime assertions confirmed an unauthenticated 307 redirect, HTTP 200 login page, HTTP 401 for incorrect credentials, HTTP 200 for valid authentication and protected project access, alpha-safe PNG logo delivery, successful logout, and a renewed 307 redirect after logout. The temporary containers were stopped and removed after validation; the data volume remains preserved.

## Scan and team-member removal - 2026-10-26

The fleet inventory and workload detail view now expose a visible **Remove scan** control with explicit confirmation and loading/error states. The backend deletes the workload and its complete scan/pentest lifecycle, then detaches it from every project so project rollups immediately return to a valid state. Repeating deletion for a missing workload returns 404.

Team member rows now display a persistent labeled **Remove** control instead of revealing an icon only on hover. Confirmation, in-progress feedback, error handling, and refreshed member counts are included.

Verification completed with all 15 Python/API tests, including cascade cleanup, missing-workload behavior, project detachment, and member-count assertions. Strict TypeScript validation, the Next.js production build, and updated server/console Docker image builds also passed. A final all-profile audit found a previously active red-team worker whose restart policy had kept the stack alive; `docker compose --profile redteam down` removed the worker, console, server, and network. No VigilAI containers remain running and the persistent data volume is preserved.

## Browser favicon visibility - 2026-10-26

The full primary logo was too detailed and padded for a browser's 16-pixel tab slot. A dedicated transparent favicon variant now uses thicker geometry, higher light/dark contrast, and a close crop that fills 96% of the canvas vertically. Console metadata references the cache-busting `/vigilai-favicon-v2.png` URL as both standard and shortcut icon while retaining the full logo for the Apple icon and in-product branding. The authentication proxy explicitly treats both branding images as public assets so favicon requests receive PNG data instead of a login redirect.

Verification passed through the production Next.js and container builds. Live rendered HTML contained both favicon links, and the unauthenticated favicon request returned HTTP 200, `image/png`, and the complete PNG body rather than redirected login HTML. The temporary verification stack was explicitly stopped across all Compose profiles.

## Deterministic test agents - 2026-10-26

An optional `vigilai-test-agents` service now provides four local agent types: safe support, simulated shell-vulnerable tool use, simulated RAG exfiltration, and approval-gated order operations. Every endpoint supports read-only discovery, OpenAPI schemas, the VigilAI dynamic-test request contract, and deterministic trace evidence. Vulnerable behavior is inert outside `test_mode` and never performs a real side effect.

The repository-wide test configuration now includes the new package. All 19 tests pass. Docker built all four application images and started the server, console, red-team worker, and test-agent laboratory. Host and in-container checks confirmed the catalog, health endpoint, all four behavior profiles, OpenAPI discovery, and Docker localhost translation.

Four named fixture workloads were onboarded and dynamically assessed for immediate dashboard use. Each completed five episodes: Safe Support and Approval-Gated Orders passed with 0% ASR; Vulnerable Shell and RAG Exfiltration failed with 20% ASR and persisted evidence. All four services remain running and healthy.

