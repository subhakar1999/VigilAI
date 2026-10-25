# Repository File Change Ledger

This document is the authoritative ledger of files added, removed, renamed, or materially modified while building VigilAI.

## Maintenance rule

Update this file in the same change set whenever a tracked file is added, removed, renamed, or materially changed. Each entry must include the date, change type, affected paths, and a short reason. Generated and ignored build artifacts do not require entries unless their creation or removal is operationally significant.

Change types: `ADDED`, `MODIFIED`, `REMOVED`, and `RENAMED`.

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

No application source files changed during shutdown or publication preparation. The target GitHub repository was confirmed to exist with no prior commits, so the workspace can be published as a new `main` branch without overwriting remote history.

