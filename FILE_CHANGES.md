# Repository File Change Ledger

This document is the authoritative ledger of files added, removed, renamed, or materially modified while building VigilAI.

## Maintenance rule

Update this file in the same change set whenever a tracked file is added, removed, renamed, or materially changed. Each entry must include the date, change type, affected paths, and a short reason. Generated and ignored build artifacts do not require entries unless their creation or removal is operationally significant.

Change types: `ADDED`, `MODIFIED`, `REMOVED`, and `RENAMED`.

## 2026-11-08 — Unused-code audit

| Change | Path | Purpose |
| --- | --- | --- |
| MODIFIED | `packages/vigilai-server/app/main.py` | Remove an unused schema import. |
| MODIFIED | `PROGRESS.md`, `FILE_CHANGES.md` | Record the audit and cleanup. |

## 2026-11-08 — One-command local shutdown

| Change | Path | Purpose |
| --- | --- | --- |
| ADDED | `Stop-Local.cmd`, `scripts/stop-local.ps1` | Stop the project's Compose services and identifiable local AI example process without deleting data. |
| ADDED | `tests/stop-local.test.ps1` | Verify that project services are targeted and unrelated processes are preserved. |
| MODIFIED | `scripts/start-ai-examples.ps1` | Include the project directory in the example process command line for safe identification. |
| MODIFIED | `README.md`, `repo-layout.md`, `PROGRESS.md`, `FILE_CHANGES.md` | Document the shutdown command, runtime status, and scope. |

## 2026-11-08 — Real model, agent and workflow examples

| Change | Path | Purpose |
| --- | --- | --- |
| ADDED | `examples/real_ai/__init__.py`, `examples/real_ai/main.py`, `examples/real_ai/requirements.txt`, `examples/real_ai/tests/test_examples.py` | Model-backed local endpoints, real tool and workflow behavior, dependencies, and tests. |
| ADDED | `Start-AI-Examples.cmd`, `scripts/start-ai-examples.ps1` | Start the Ollama-backed example service on Windows. |
| MODIFIED | `.gitignore`, `pyproject.toml` | Ignore the isolated example environment and include example tests. |
| ADDED | `.venv-examples/` (ignored) | Isolated Python environment created by the launcher during validation; contains installed example dependencies. |
| MODIFIED | `packages/vigilai-redteam/redteam/daemon.py`, `docker-compose.yml` | Allow configurable request and lease timeouts for slower real models. |
| MODIFIED | `README.md`, `repo-layout.md`, `PROGRESS.md`, `FILE_CHANGES.md` | Document the endpoints, usage, limitations and verification. |

## 2026-11-08 — One-command local startup

| Change | Path | Purpose |
| --- | --- | --- |
| ADDED | `Start-Local.cmd`, `scripts/start-local.ps1` | One-command Windows startup for the complete local stack with first-run credential creation. |
| ADDED | `tests/start-local.test.ps1` | Isolated launcher test for first-run credentials, preserving settings, and Compose profiles. |
| MODIFIED | `README.md`, `repo-layout.md`, `PROGRESS.md`, `FILE_CHANGES.md` | Explain and record the launcher, prerequisites, and credential behavior. |

## 2026-11-03 — Cleanup and Vercel documentation

| Change | Path | Purpose |
| --- | --- | --- |
| MODIFIED | `README.md` | Replace the previous guide with clear setup, testing, CLI and Vercel console instructions and current limitations. |
| MODIFIED | `packages/vigilai-console/src/app/page.tsx`, `packages/vigilai-console/src/app/api/playground/probe/route.ts` | Remove unused imports and simulation request fields. |
| MODIFIED | `packages/vigilai-console/src/components/AgentPlayground.tsx`, `CicdWebhookGenerator.tsx`, `LandingArchitecture.tsx`, `LandingBeyondOwasp.tsx`, `LandingComparison.tsx`, `LandingHeroInteractive.tsx`, `LandingOwaspMatrix.tsx`, `LandingTestLab.tsx`, `PatchDiffViewer.tsx` | Remove unused imports and a redundant variable; component paths are under `packages/vigilai-console/src/components/`. |
| MODIFIED | `packages/vigilai-console/src/lib/api.ts`, `packages/vigilai-console/Dockerfile`, `docker-compose.yml` | Remove the unused browser-exposed API URL build setting and add public-origin configuration. |
| ADDED | `packages/vigilai-console/src/lib/origin.ts`, `packages/vigilai-console/tests/origin.test.cjs` | Validate configured public or local request origins and cover accepted and rejected cases. |
| MODIFIED | `packages/vigilai-console/src/app/api/control/[...path]/route.ts`, `.env.example` | Use explicit public-origin validation and document the setting. |
| MODIFIED | `PROGRESS.md`, `FILE_CHANGES.md`, `System-design.md`, `repo-layout.md` | Record the cleanup, deployment boundary, verification, and new origin setting. |

## 2026-11-03 — Stop runtime and inspect sign-in

| Change | Path | Purpose |
| --- | --- | --- |
| MODIFIED | `PROGRESS.md`, `FILE_CHANGES.md` | Record the stopped services and sign-in investigation. |

## 2026-11-03 — End-to-end test run

| Change | Path | Purpose |
| --- | --- | --- |
| MODIFIED | `.env` (ignored) | Added a randomly generated local API token; its value is not recorded here. |
| MODIFIED | `PROGRESS.md`, `FILE_CHANGES.md` | Recorded runtime status, retained test records, verification results, and the portal origin failure. |

## 2026-11-03 — Authentication and egress hardening

| Change | Path | Purpose |
| --- | --- | --- |
| MODIFIED | `packages/vigilai-console/src/lib/auth.ts` | Remove fixed fallback credentials and signing secret; fail closed if configuration is missing. |
| ADDED | `packages/vigilai-console/tests/auth.test.cjs` | Verify configured login, rejection of fallback passwords, and missing-configuration behavior. |
| MODIFIED | `docker-compose.yml`, `.env.example` | Require a separate API token and restrict the published API port to loopback. |
| ADDED | `deploy/kubernetes/egress-policy.yaml` | Provide opt-in, deny-by-default egress for labelled security service pods. |
| MODIFIED | `README.md`, `repo-layout.md`, `System-design.md`, `PROGRESS.md`, `FILE_CHANGES.md` | Record configuration changes, unverified deployment policy, and remaining isolation work. |

## 2026-11-03 — Assessment reliability and API access

| Change | Path | Purpose |
| --- | --- | --- |
| ADDED | `packages/vigilai-server/app/auth.py`, `packages/vigilai-server/app/endpoint_policy.py` | Control-plane token validation and explicit endpoint host policy. |
| ADDED | `packages/vigilai-console/src/app/api/control/[...path]/route.ts` | Session-protected same-origin control-plane proxy. |
| ADDED | `packages/vigilai-server/tests/conftest.py`, `packages/vigilai-server/tests/test_access_and_coverage.py` | API access, host policy, and incomplete-evidence coverage. |
| MODIFIED | `packages/vigilai-server/app/main.py`, `packages/vigilai-server/app/quality_gate.py`, `packages/vigilai-server/app/endpoint_discovery.py` | Re-evaluate incomplete assessments, protect operations, and restrict discovery targets. |
| MODIFIED | `packages/vigilai-redteam/redteam/assertions.py`, `packages/vigilai-redteam/redteam/harness.py`, `packages/vigilai-redteam/redteam/daemon.py`, `packages/vigilai-scanner/vigilai/uploader.py` | Validate evidence, restrict agent targets, and authenticate control-plane clients. |
| MODIFIED | `packages/vigilai-console/src/lib/api.ts`, `packages/vigilai-console/src/components/ArtifactActions.tsx`, `EndpointOnboardForm.tsx`, `ProjectCreateForm.tsx`, `TeamDirectory.tsx`, `WorkloadDeleteButton.tsx` | Route console API requests through authenticated server-side access. Component paths are under `packages/vigilai-console/src/components/`. |
| MODIFIED | `packages/vigilai-console/src/components/QualityGateBadge.tsx`, `WorkloadInventory.tsx`, `AgentPlayground.tsx`, `packages/vigilai-console/src/app/workloads/[id]/page.tsx`, `packages/vigilai-console/src/app/api/playground/probe/route.ts` | Explain inconclusive results and label the non-networked playground simulation. Component paths are under `packages/vigilai-console/src/components/`. |
| MODIFIED | `packages/vigilai-server/tests/test_api.py`, `packages/vigilai-redteam/tests/test_harness.py`, `docker-compose.yml`, `.env.example`, `README.md`, `repo-layout.md`, `System-design.md`, `PROGRESS.md`, `FILE_CHANGES.md` | Verify and document the new behavior and configuration. |

## 2026-11-03 — Finding remediation and landing-page follow-up

| Change | Path | Purpose |
| --- | --- | --- |
| ADDED | `packages/vigilai-console/src/components/FindingRemediation.tsx` | Displays static findings, advisory fixes, and evidence-specific dynamic guidance. |
| MODIFIED | `packages/vigilai-console/src/components/GateFailureDetails.tsx` | Shows remediation per violation and removes the unrelated sample patch from actual failures. |
| MODIFIED | `packages/vigilai-console/src/app/workloads/[id]/page.tsx` | Displays findings and suggested fixes on every workload page. |
| MODIFIED | `README.md`, `System-design.md`, `repo-layout.md`, `PROGRESS.md`, `FILE_CHANGES.md` | Documents routes, remediation behavior, runtime status, and progress. |
| ADDED | `packages/vigilai-console/src/app/console/page.tsx` | Hosts the protected fleet previously served at the root. |
| MODIFIED | `packages/vigilai-console/src/app/page.tsx`, `packages/vigilai-console/src/app/globals.css`, `packages/vigilai-console/src/components/ConsoleShell.tsx`, `packages/vigilai-console/src/proxy.ts`, `packages/vigilai-console/src/components/LoginForm.tsx`, `packages/vigilai-console/src/app/login/page.tsx`, `packages/vigilai-console/src/components/WorkloadDeleteButton.tsx` | Public product landing page and protected-console navigation. |

## 2026-10-24 — Initial platform implementation

### Repository and operations

| Change | Path | Purpose |
| --- | --- | --- |
| ADDED | `.gitignore` | Excludes Python, Node.js, build, database, scan, environment, and local tool artifacts. |
| ADDED | `.github/workflows/vigilai-scan.yml` | Runs Python tests, repository scanning, SARIF upload, console type checking, and production builds. |
| ADDED | `docker-compose.yml` | Orchestrates the API server and web console with persistent SQLite storage. |
| ADDED | `pyproject.toml` | Defines root pytest discovery across all Python packages. |
| ADDED | `LICENSE` | Declares the repository's Apache 2.0 licensing notice. |
| MODIFIED | `README.md` | Added local development, verification, and integrated runtime instructions. |

### Scanner package

| Change | Path | Purpose |
| --- | --- | --- |
| ADDED | `packages/vigilai-scanner/pyproject.toml` | Scanner packaging, dependencies, CLI entry point, and test settings. |
| ADDED | `packages/vigilai-scanner/vigilai/__init__.py` | Package metadata. |
| ADDED | `packages/vigilai-scanner/vigilai/model_scanner.py` | Fail-closed symbolic pickle/PVM model scanner. |
| ADDED | `packages/vigilai-scanner/vigilai/ast_visitor.py` | Agent AST analysis, taint tracking, guardrail checks, and graph extraction. |
| ADDED | `packages/vigilai-scanner/vigilai/mcp_auditor.py` | MCP prompt-injection/shadowing checks and SHA-256 lock generation. |
| ADDED | `packages/vigilai-scanner/vigilai/uploader.py` | HTTP scan submission client. |
| ADDED | `packages/vigilai-scanner/vigilai/cli.py` | `scan`, `mcp-lock`, and `onboard` Typer commands. |
| ADDED | `packages/vigilai-scanner/vigilai/emitters/__init__.py` | Emitter package declaration. |
| ADDED | `packages/vigilai-scanner/vigilai/emitters/sarif.py` | SARIF 2.1.0 report generation. |
| ADDED | `packages/vigilai-scanner/vigilai/emitters/aibom.py` | CycloneDX 1.6 AI/ML BOM generation. |
| ADDED | `packages/vigilai-scanner/tests/test_model_scanner.py` | Unsafe pickle `__reduce__` exploit regression test. |
| ADDED | `packages/vigilai-scanner/tests/test_ast_visitor.py` | Tainted tool input to shell execution regression test. |

### Control-plane package

| Change | Path | Purpose |
| --- | --- | --- |
| ADDED | `packages/vigilai-server/pyproject.toml` | Server packaging, dependencies, and test extras. |
| ADDED | `packages/vigilai-server/Dockerfile` | Production API container. |
| ADDED | `packages/vigilai-server/app/__init__.py` | Server package declaration. |
| ADDED | `packages/vigilai-server/app/database.py` | SQLModel engine, table initialization, and session dependency. |
| ADDED | `packages/vigilai-server/app/models.py` | Workload, scan, and pentest persistence models. |
| ADDED | `packages/vigilai-server/app/schemas.py` | Validated API request and response contracts. |
| ADDED | `packages/vigilai-server/app/quality_gate.py` | Deterministic static, topology, and dynamic gate evaluation. |
| ADDED | `packages/vigilai-server/app/main.py` | FastAPI lifecycle, health check, scan, workload, and pentest endpoints. |
| ADDED | `packages/vigilai-server/tests/test_quality_gate.py` | Tainted dangerous-sink gate regression test. |
| ADDED | `packages/vigilai-server/tests/test_api.py` | In-memory scan-to-pentest API integration test. |

### Console package

| Change | Path | Purpose |
| --- | --- | --- |
| ADDED | `packages/vigilai-console/package.json` | Console scripts and patched production dependencies. |
| ADDED | `packages/vigilai-console/package-lock.json` | Reproducible npm dependency lock. |
| ADDED | `packages/vigilai-console/tsconfig.json` | Strict TypeScript and Next.js configuration. |
| ADDED | `packages/vigilai-console/next-env.d.ts` | Next.js TypeScript declarations. |
| ADDED | `packages/vigilai-console/next.config.js` | Standalone production output and header hardening. |
| ADDED | `packages/vigilai-console/postcss.config.js` | Tailwind CSS PostCSS integration. |
| ADDED | `packages/vigilai-console/tailwind.config.ts` | Tailwind source configuration. |
| ADDED | `packages/vigilai-console/Dockerfile` | Multi-stage production console container. |
| ADDED | `packages/vigilai-console/public/.gitkeep` | Retains the public asset directory. |
| ADDED | `packages/vigilai-console/src/app/globals.css` | Visual system, accessibility motion handling, and React Flow styling. |
| ADDED | `packages/vigilai-console/src/app/layout.tsx` | Root metadata and application shell. |
| ADDED | `packages/vigilai-console/src/app/page.tsx` | Fleet workload inventory dashboard. |
| ADDED | `packages/vigilai-console/src/app/not-found.tsx` | Workload/API failure page. |
| ADDED | `packages/vigilai-console/src/app/workloads/[id]/page.tsx` | Workload graph and security metrics view. |
| ADDED | `packages/vigilai-console/src/components/FlowGraph.tsx` | Interactive React Flow topology renderer. |
| ADDED | `packages/vigilai-console/src/components/NodeDrawer.tsx` | Node evidence and remediation inspector. |
| ADDED | `packages/vigilai-console/src/components/QualityGateBadge.tsx` | Consistent quality-gate status indicator. |
| ADDED | `packages/vigilai-console/src/lib/api.ts` | Typed control-plane API client. |
| ADDED | `packages/vigilai-console/src/lib/types.ts` | Shared console workload and graph types. |

### Red-team package

| Change | Path | Purpose |
| --- | --- | --- |
| ADDED | `packages/vigilai-redteam/pyproject.toml` | Worker packaging, dependencies, CLI, and test settings. |
| ADDED | `packages/vigilai-redteam/Dockerfile` | Production worker container. |
| ADDED | `packages/vigilai-redteam/redteam/__init__.py` | Worker package declaration. |
| ADDED | `packages/vigilai-redteam/redteam/assertions.py` | Deterministic tool and network trace assertions. |
| ADDED | `packages/vigilai-redteam/redteam/harness.py` | Asynchronous probe execution and callback reporting. |
| ADDED | `packages/vigilai-redteam/redteam/daemon.py` | Workload-driven red-team CLI entry point. |
| ADDED | `packages/vigilai-redteam/redteam/probes/__init__.py` | Probe package declaration. |
| ADDED | `packages/vigilai-redteam/redteam/probes/ipi_probes.py` | Indirect prompt-injection and exfiltration episodes. |
| ADDED | `packages/vigilai-redteam/redteam/probes/tool_chaining.py` | Tool parameter-hijacking episode. |
| ADDED | `packages/vigilai-redteam/tests/test_harness.py` | Dynamic bypass and quality-gate regression test. |

### Removals and cleanup

| Change | Path | Purpose |
| --- | --- | --- |
| REMOVED | `vigilai.db` | Removed the transient SQLite database created during API verification. Runtime databases remain ignored. |
| REMOVED | package `__pycache__/` directories | Removed transient Python bytecode created during verification. |

### Dependency security adjustment

The console was initially implemented against Next.js 14 as specified. The newest available Next.js 14 release reported critical advisories during `npm audit`, so the console was materially updated to Next.js 16.4.3, React 19.2, Tailwind CSS 4.3.3, TypeScript 5.9, and Node.js 22 container/CI images. The App Router architecture was retained. The resulting audit reported zero vulnerabilities.

## 2026-10-24 — Living documentation

| Change | Path | Purpose |
| --- | --- | --- |
| ADDED | `FILE_CHANGES.md` | Introduced this repository file-change ledger. |
| ADDED | `PROGRESS.md` | Introduced the implementation progress and verification record. |
| MODIFIED | `README.md` | Linked the two living project records. |

No tracked source files were renamed or removed during this initial documentation entry.

## 2026-10-24 — VigilAI namespace consolidation

| Change | Path | Purpose |
| --- | --- | --- |
| RENAMED | `.github/workflows/vigilai-scan.yml` | Standardized the CI workflow filename on the VigilAI product namespace. |
| RENAMED | `packages/vigilai-scanner/` | Standardized the scanner distribution directory and project name. |
| RENAMED | `packages/vigilai-scanner/vigilai/` | Standardized the scanner's importable Python namespace. |
| RENAMED | `packages/vigilai-server/` | Standardized the control-plane distribution directory and project name. |
| RENAMED | `packages/vigilai-console/` | Standardized the console distribution directory and npm package name. |
| RENAMED | `packages/vigilai-redteam/` | Standardized the worker distribution directory, project name, and executable. |
| MODIFIED | Repository source and documentation | Replaced all legacy product identifiers with `VigilAI`/`vigilai`. |
| MODIFIED | CLI and configuration contracts | Renamed the CLI to `vigilai`, environment variables to the `VIGILAI_` prefix, the runtime database to `vigilai.db`, and AIBOM properties to the `vigilai:` namespace. |
| MODIFIED | `README.md`, `INSTRUCTIONS.md`, `repo-layout.md`, `System-design.md` | Aligned user guidance, specifications, layout, and architecture diagrams with the VigilAI namespace. |
| MODIFIED | `FILE_CHANGES.md`, `PROGRESS.md` | Recorded the completed namespace migration and its verification status. |

No legacy product identifiers remain in tracked source paths or source content after this migration.

Verification after the rename: five Python tests passed, the `vigilai` CLI scan completed, the console passed strict type checking and a production build, Docker Compose configuration remained valid, Python dependencies were compatible, npm reported zero vulnerabilities, and a full workspace audit found no legacy identifiers in content or paths.

## 2026-10-24 — Local application startup

| Change | Path | Purpose |
| --- | --- | --- |
| ADDED | `packages/vigilai-console/.dockerignore` | Excludes local dependencies, build output, logs, and environment files from the console build context. |
| ADDED | `packages/vigilai-server/.dockerignore` | Excludes caches, tests, databases, and local artifacts from the API build context. |
| MODIFIED | `FILE_CHANGES.md`, `PROGRESS.md` | Recorded the first integrated Docker startup and runtime verification. |

Docker images `vigilai-server` and `vigilai-console` were built, and the Compose services were started with persistent local storage. Runtime verification confirmed a healthy API and an HTTP 200 response from the console.

## 2026-10-24 — Core implementation completion

| Change | Path | Purpose |
| --- | --- | --- |
| MODIFIED | `packages/vigilai-server/app/models.py` | Added durable pentest request records and lifecycle state. |
| MODIFIED | `packages/vigilai-server/app/schemas.py` | Added typed scan topology, finding, trigger, lease, failure, endpoint, and worker validation contracts. |
| MODIFIED | `packages/vigilai-server/app/main.py` | Added pentest trigger/lease/failure APIs, stale lease recovery, MCP schema delivery, worker ownership checks, and compromised-node resets. |
| MODIFIED | `packages/vigilai-redteam/redteam/daemon.py` | Added continuous queue polling alongside one-shot execution. |
| MODIFIED | `packages/vigilai-redteam/redteam/harness.py` | Added request-aware callbacks, queue clients, failure reporting, and schema-aware execution. |
| MODIFIED | `packages/vigilai-redteam/redteam/probes/tool_chaining.py` | Added dynamic probes for dangerous MCP tool schemas. |
| ADDED | `packages/vigilai-redteam/.dockerignore` | Reduced worker container build context. |
| MODIFIED | `packages/vigilai-scanner/vigilai/cli.py` | Added optional target endpoint onboarding. |
| MODIFIED | `packages/vigilai-scanner/vigilai/ast_visitor.py` | Added bounded LangGraph invocation checks and globally unique topology node identifiers. |
| MODIFIED | `packages/vigilai-scanner/vigilai/model_scanner.py` | Added dependency-tree exclusions and bounded archive/raw pickle reads. |
| MODIFIED | `packages/vigilai-scanner/vigilai/mcp_auditor.py` | Made lock generation resilient to invalid configurations and excluded generated trees. |
| MODIFIED | `packages/vigilai-scanner/vigilai/emitters/aibom.py` | Added streaming hashes and embedded MCP command, argument, and tool-schema evidence. |
| ADDED | `packages/vigilai-console/src/components/ArtifactActions.tsx` | Added AIBOM download and queued pentest controls. |
| MODIFIED | `packages/vigilai-console/src/components/NodeDrawer.tsx` | Added one-click remediation copying. |
| MODIFIED | `packages/vigilai-console/src/app/workloads/[id]/page.tsx` | Integrated artifact and dynamic assessment actions. |
| MODIFIED | `packages/vigilai-console/Dockerfile`, `docker-compose.yml` | Added browser API configuration and an optional polling worker profile. |
| MODIFIED | `.github/workflows/vigilai-scan.yml` | Made quality-gate scan failures block CI instead of being ignored. |
| ADDED | `packages/vigilai-scanner/tests/test_mcp_auditor.py` | Added MCP poisoning, shadowing, invalid-config, lock, and AIBOM tests. |
| ADDED | `packages/vigilai-server/tests/test_bundle_contract.py` | Added scanner-to-server contract verification. |
| MODIFIED | Package tests | Expanded coverage for one-hop taint, LangGraph limits, queue lifecycle, schema delivery, worker polling, and dynamic probe generation. |
| MODIFIED | `README.md`, `System-design.md`, `PROGRESS.md`, `FILE_CHANGES.md` | Updated runtime commands, capabilities, architecture labels, progress, and change history. |
| MODIFIED | `repo-layout.md` | Added the artifact action component to the documented console layout. |

Final verification completed with 11 passing Python tests, a successful strict TypeScript check and Next.js production build, zero npm vulnerabilities, compatible Python dependencies, a clean self-scan with enforced quality gate, and successful builds for all three Docker images. The previously running Compose services were stopped and removed without deleting the persistent data volume; final status confirms no containers are running.

## 2026-10-25 — Runtime monitoring

| Change | Path | Purpose |
| --- | --- | --- |
| MODIFIED | `PROGRESS.md`, `FILE_CHANGES.md` | Recorded the monitored runtime state, endpoint latency, container resources, queue behavior, and log review. |

No application source files changed during monitoring. The API, console, and red-team worker were started and remain running; all observed endpoints were healthy and no runtime errors or restarts were detected.

## 2026-10-25 — Runtime shutdown

| Change | Path | Purpose |
| --- | --- | --- |
| MODIFIED | `PROGRESS.md`, `FILE_CHANGES.md` | Recorded the requested shutdown and verified stopped state. |

No application source files changed. All VigilAI containers and the Compose network were removed; the persistent data volume was retained.

## 2026-10-26 - Runtime startup

| Change | Path | Purpose |
| --- | --- | --- |
| MODIFIED | `PROGRESS.md`, `FILE_CHANGES.md` | Recorded the requested application startup and live runtime verification. |

No application source files changed. Docker Desktop and the complete VigilAI Compose profile were started. The API, console, and red-team worker are running with zero restarts; all checked HTTP endpoints returned 200 and recent logs showed no error signatures.

## 2026-10-26 - Endpoint-only portal onboarding

| Change | Path | Purpose |
| --- | --- | --- |
| ADDED | `packages/vigilai-server/app/endpoint_discovery.py` | Performs bounded read-only endpoint and OpenAPI discovery, Docker localhost translation, topology generation, and endpoint AIBOM creation. |
| ADDED | `packages/vigilai-server/tests/test_endpoint_discovery.py` | Covers OpenAPI operation extraction and Docker host translation. |
| ADDED | `packages/vigilai-console/src/components/EndpointOnboardForm.tsx` | Adds the portal form for onboarding an agent directly from its endpoint URL. |
| MODIFIED | `packages/vigilai-server/app/main.py`, `schemas.py`, `pyproject.toml` | Adds the endpoint onboarding API, validated contracts, persistence integration, and runtime HTTP client dependency. |
| MODIFIED | `packages/vigilai-server/tests/test_api.py` | Verifies endpoint-only onboarding and workload persistence through the control plane. |
| MODIFIED | `packages/vigilai-scanner/vigilai/cli.py`, `uploader.py` | Supports source-free endpoint onboarding with an inferred optional name while preserving source scanning. |
| MODIFIED | `packages/vigilai-console/src/app/page.tsx`, `workloads/[id]/page.tsx` | Replaces the CLI-only placeholder with Add endpoint and displays the registered endpoint on workload details. |
| MODIFIED | `README.md`, `repo-layout.md`, `System-design.md`, `PROGRESS.md`, `FILE_CHANGES.md` | Documents the endpoint-only workflow, architecture, limitations, verification, and file changes. |

Endpoint discovery is intentionally read-only and bounded. It does not claim to recover unavailable source, model, prompt, or MCP internals from a black-box endpoint; those remain available through the source-scan workflow.

Deployment verification completed successfully: 14 Python tests passed, strict TypeScript checking passed, the Next.js production build passed, Docker rebuilt and restarted the server and console, the API remained healthy, the portal rendered **Add endpoint**, the new route appeared in OpenAPI, and recent container logs contained no error signatures. The generated `.next` output was removed and recreated during verification; it is ignored and recoverable build output, not tracked source.

## 2026-10-26 - Runtime shutdown and GitHub publication

| Change | Path | Purpose |
| --- | --- | --- |
| MODIFIED | `.gitignore` | Removed duplicate cache exclusions while retaining local environments, generated output, databases, SARIF, and secrets exclusions. |
| MODIFIED | `PROGRESS.md`, `FILE_CHANGES.md` | Recorded the stopped runtime, preserved data volume, credential audit, and initial GitHub publication preparation. |

No application source files changed during shutdown or publication. The target GitHub repository was confirmed to contain no prior commits, and the initial implementation was pushed to its new `main` branch as commit `b5ba59f` without overwriting remote history. This ledger update records the completed publication.

## 2026-10-26 - Functional-test diagnosis

| Change | Path | Purpose |
| --- | --- | --- |
| MODIFIED | `PROGRESS.md`, `FILE_CHANGES.md` | Recorded the restarted runtime, expected demo-agent security failure, Windows pytest temp-directory issue, and successful isolated verification. |

No application source files changed. Runtime evidence showed three intentionally simulated red-team violations and a correctly failed quality gate, while the isolated automated suite completed with 14 passing tests.

## 2026-10-26 - Dashboard quality-gate explanations

| Change | Path | Purpose |
| --- | --- | --- |
| ADDED | `packages/vigilai-console/src/components/GateFailureDetails.tsx` | Displays gate reasons, blocking findings, failed episodes, tool/network evidence, affected nodes, and raw traces. |
| MODIFIED | `packages/vigilai-server/app/main.py` | Enriches workload detail responses with the latest persisted pentest run and deterministic gate reasons; retains detailed evidence in current stats. |
| MODIFIED | `packages/vigilai-server/app/schemas.py` | Adds quality-gate reasons to the validated workload-detail response. |
| MODIFIED | `packages/vigilai-server/tests/test_api.py` | Verifies persisted violation logs and computed failure reasons in workload details. |
| MODIFIED | `packages/vigilai-console/src/lib/types.ts`, `src/app/workloads/[id]/page.tsx` | Adds typed pentest evidence and integrates the failure-details panel. |
| MODIFIED | `README.md`, `repo-layout.md`, `System-design.md`, `PROGRESS.md`, `FILE_CHANGES.md` | Documents failure evidence, architecture, verification, and file changes. |

The deployed existing `test` workload now explains its 100% ASR with three concrete violations: forbidden `shell`, forbidden `vigilai.invalid` network access, and forbidden `update_order`. All 14 Python tests, TypeScript validation, and the production console build pass.

## 2026-10-26 - Canonical GitHub link

| Change | Path | Purpose |
| --- | --- | --- |
| MODIFIED | `packages/vigilai-console/src/app/layout.tsx` | Links the header GitHub icon to `subhakar1999/VigilAI` in a safely isolated new tab. |
| MODIFIED | `README.md` | Replaces the placeholder clone command with the canonical VigilAI repository URL. |
| MODIFIED | `PROGRESS.md`, `FILE_CHANGES.md` | Records the repository-link update and its verification. |

Verification passed through strict TypeScript checking, a production console build, a rebuilt console container, and rendered-page assertions for the canonical URL and `_blank` target. The running console reported no recent error signatures.

## 2026-10-26 - Runtime shutdown after UI verification

| Change | Path | Purpose |
| --- | --- | --- |
| MODIFIED | `PROGRESS.md`, `FILE_CHANGES.md` | Records the requested shutdown after dashboard and repository-link verification. |

No application source files changed during shutdown. All VigilAI containers and the Compose network were removed; the persistent data volume was retained.

## 2026-10-26 - SaaSFrame-inspired console redesign

| Change | Path | Purpose |
| --- | --- | --- |
| ADDED | `packages/vigilai-console/src/components/ConsoleShell.tsx` | Adds responsive sidebar navigation, mobile drawer, workspace status, API/docs links, and repository access. |
| ADDED | `packages/vigilai-console/src/components/WorkloadInventory.tsx` | Adds live name/framework search, gate-status filters, structured data-grid rows, and responsive empty states. |
| MODIFIED | `packages/vigilai-console/src/app/layout.tsx`, `globals.css` | Introduces the operational workspace shell, refined surface tokens, typography, background, and global visual hierarchy. |
| MODIFIED | `packages/vigilai-console/src/app/page.tsx` | Rebuilds the fleet overview with compact hierarchy, four bento posture metrics, and the interactive inventory. |
| MODIFIED | `packages/vigilai-console/src/app/workloads/[id]/page.tsx` | Reorganizes workload identity, endpoint, actions, metrics, failure evidence, and topology into structured surfaces. |
| MODIFIED | `packages/vigilai-console/src/components/EndpointOnboardForm.tsx`, `ArtifactActions.tsx`, `GateFailureDetails.tsx` | Aligns dialogs, primary/secondary actions, terminology, and failure panels with the new console system. |
| MODIFIED | `README.md`, `repo-layout.md`, `System-design.md`, `PROGRESS.md`, `FILE_CHANGES.md` | Records the chosen inspiration source, UI architecture, verification, and file changes. |

The redesign adapts general SaaS dashboard patterns without copying proprietary screens or assets. Strict TypeScript validation, the Next.js production build, and the console Docker image build completed successfully; the runtime remains stopped.

## 2026-10-26 - SonarQube-inspired projects and teams

| Change | Path | Purpose |
| --- | --- | --- |
| MODIFIED | `packages/vigilai-server/app/models.py` | Adds persistent project, team, and team-member records without altering the existing workload table. |
| MODIFIED | `packages/vigilai-server/app/schemas.py` | Adds validated project, membership, role, visibility, provider, and aggregate response contracts. |
| MODIFIED | `packages/vigilai-server/app/main.py` | Adds project/team CRUD-style endpoints, membership onboarding/removal, workload association, and aggregate gate/risk calculation. |
| ADDED | `packages/vigilai-server/tests/test_project_team_api.py` | Verifies team membership, project creation, repository metadata, workload assignment, rollups, listing, and removal. |
| ADDED | `packages/vigilai-console/src/app/projects/page.tsx` | Adds the project portfolio, posture totals, repository metadata, and aggregate status UI. |
| ADDED | `packages/vigilai-console/src/app/teams/page.tsx` | Adds the team onboarding and ownership page. |
| ADDED | `packages/vigilai-console/src/components/ProjectCreateForm.tsx` | Adds portal project creation, team selection, repository binding, visibility, and workload assignment. |
| ADDED | `packages/vigilai-console/src/components/TeamDirectory.tsx` | Adds team creation, member invitation, governance roles, and member removal. |
| MODIFIED | `packages/vigilai-console/src/components/ConsoleShell.tsx` | Adds Projects and Teams navigation and contextual page titles. |
| MODIFIED | `packages/vigilai-console/src/lib/api.ts`, `src/lib/types.ts` | Adds typed project and team console contracts and fetchers. |
| MODIFIED | `README.md`, `repo-layout.md`, `System-design.md`, `PROGRESS.md`, `FILE_CHANGES.md` | Documents use, hierarchy, limitations, verification, and the complete change ledger. |

No tracked files were removed or renamed. Agent Reach was not needed because official SonarQube documentation was sufficient. The requested REA workflow inspected the generated standalone JavaScript artifact; its Evidence ID and partial static-analysis limitation are recorded in `PROGRESS.md`.

Verification passed with 15 Python/API tests, strict TypeScript checking, a production Next.js build, Compose configuration validation, and updated server/console Docker image builds. No application container was started; the stack remains stopped and the persistent data volume remains intact.

## 2026-10-26 - Runtime startup after project/team implementation

| Change | Path | Purpose |
| --- | --- | --- |
| MODIFIED | `PROGRESS.md`, `FILE_CHANGES.md` | Records the requested startup and live health checks for the API, Projects, Teams, and console endpoints. |

No application source file changed during startup. The server and console containers are running; the persistent data volume remains attached.

## 2026-10-26 - VigilAI logo and console login

| Change | Path | Purpose |
| --- | --- | --- |
| ADDED (local, ignored) | `.env` | Stores the local console username, password, HMAC signing secret, and cookie transport setting outside Git. |
| ADDED | `.env.example` | Documents safe authentication configuration placeholders for new environments. |
| ADDED | `packages/vigilai-console/public/vigilai-logo.png` | Adds the generated transparent VigilAI logo used by the product interface and metadata. |
| ADDED | `packages/vigilai-console/src/lib/auth.ts` | Validates server-side credentials and creates/verifies signed, expiring session tokens. |
| ADDED | `packages/vigilai-console/src/proxy.ts` | Redirects unauthenticated portal requests to the login page. |
| ADDED | `packages/vigilai-console/src/app/api/auth/login/route.ts` | Validates credentials and issues the HTTP-only session cookie. |
| ADDED | `packages/vigilai-console/src/app/api/auth/logout/route.ts` | Expires the authenticated session cookie. |
| ADDED | `packages/vigilai-console/src/app/login/page.tsx` | Provides the dedicated login route. |
| ADDED | `packages/vigilai-console/src/components/LoginForm.tsx` | Implements the branded, accessible username/password experience and error states. |
| MODIFIED | `packages/vigilai-console/src/components/ConsoleShell.tsx` | Uses the generated mark, excludes the login page from the workspace shell, and adds logout. |
| MODIFIED | `packages/vigilai-console/src/app/layout.tsx` | Registers the generated logo as application and Apple icon metadata. |
| MODIFIED | `docker-compose.yml` | Supplies authentication variables from the root environment file to the console container. |
| MODIFIED | `README.md`, `repo-layout.md`, `System-design.md`, `PROGRESS.md`, `FILE_CHANGES.md` | Documents configuration, security boundaries, verification, assets, and file changes. |

No tracked file was removed or renamed. The logo was generated with the built-in image-generation skill and copied into the workspace. Authentication was tested in temporary containers, which were stopped afterward as requested.

Final verification completed with 15 Python/API tests, strict TypeScript checking, a successful production build, valid Compose configuration, an ignored local `.env`, and no running application containers.

## 2026-10-26 - Scan and team-member removal

| Change | Path | Purpose |
| --- | --- | --- |
| MODIFIED | `packages/vigilai-server/app/main.py` | Adds confirmed workload deletion with scan, pentest-run, request, and project-association cleanup. |
| MODIFIED | `packages/vigilai-server/tests/test_api.py` | Verifies child-record cleanup, successful deletion, and 404 behavior after removal. |
| MODIFIED | `packages/vigilai-server/tests/test_project_team_api.py` | Verifies project detachment/rollup and refreshed team membership after removal. |
| ADDED | `packages/vigilai-console/src/components/WorkloadDeleteButton.tsx` | Adds reusable confirmed scan removal with loading, failure, refresh, and redirect behavior. |
| MODIFIED | `packages/vigilai-console/src/components/WorkloadInventory.tsx` | Adds a visible Remove scan action beside every workload. |
| MODIFIED | `packages/vigilai-console/src/app/workloads/[id]/page.tsx` | Adds Remove scan to workload-level actions. |
| MODIFIED | `packages/vigilai-console/src/components/TeamDirectory.tsx` | Makes member removal permanently visible and adds progress/error handling. |
| MODIFIED | `README.md`, `repo-layout.md`, `System-design.md`, `PROGRESS.md`, `FILE_CHANGES.md` | Documents deletion scope, architecture, verification, and file changes. |

No tracked file was removed or renamed. Verification passed with 15 Python/API tests, strict TypeScript checking, a successful production build, and updated server/console Docker image builds. The complete Compose profile, including the restart-enabled red-team worker, was explicitly stopped; no application containers remain running.

## 2026-10-26 - Browser favicon visibility

| Change | Path | Purpose |
| --- | --- | --- |
| ADDED | `packages/vigilai-console/public/vigilai-favicon-v2.png` | Adds a close-cropped, high-contrast transparent favicon derived from the VigilAI mark. |
| MODIFIED | `packages/vigilai-console/src/app/layout.tsx` | Publishes the new cache-busting PNG as both standard and shortcut browser icon. |
| MODIFIED | `packages/vigilai-console/src/proxy.ts` | Exempts the favicon from authentication so browsers receive image data instead of redirected login HTML. |
| MODIFIED | `repo-layout.md`, `PROGRESS.md`, `FILE_CHANGES.md` | Records the favicon asset, design correction, and verification. |

The primary application logo remains unchanged. The favicon variant was produced through the built-in image-generation workflow and saved separately to preserve the original asset.

Verification confirmed the generated metadata links and direct HTTP 200 `image/png` delivery from the protected console. Production and Docker builds passed, and all temporary containers were stopped afterward.

## 2026-10-26 - Deterministic test-agent laboratory

| Change | Path | Purpose |
| --- | --- | --- |
| ADDED | `packages/vigilai-test-agents/pyproject.toml` | Defines the model-free fixture package, runtime dependencies, and test extras. |
| ADDED | `packages/vigilai-test-agents/Dockerfile`, `.dockerignore` | Packages the isolated local FastAPI fixture service. |
| ADDED | `packages/vigilai-test-agents/test_agents/__init__.py`, `main.py` | Implements the catalog and four deterministic agent profiles with simulated trace evidence. |
| ADDED | `packages/vigilai-test-agents/tests/test_agent_endpoints.py` | Covers catalog/health, safe and gated behavior, simulated violations, and inert non-test behavior. |
| MODIFIED | `pyproject.toml` | Includes the test-agent suite in the repository-wide pytest paths. |
| MODIFIED | `docker-compose.yml` | Adds the loopback-only optional `test-agents` profile and health check. |
| MODIFIED | `README.md`, `repo-layout.md`, `System-design.md`, `PROGRESS.md`, `FILE_CHANGES.md` | Documents endpoints, safety constraints, architecture, runtime status, and file additions. |

No tracked file was removed or renamed. All 19 tests and four image builds passed. Live integration verified every agent endpoint, actual VigilAI discovery, container-to-host reachability, and dynamic assessments. The full stack remains running with four fixture workloads ready in the dashboard.

