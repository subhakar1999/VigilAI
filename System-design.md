+--------------------------------------------------------------------------------------------------+
|                                    DEVELOPER & CI/CD WORKSPACE                                   |
|                                                                                                  |
|   +------------------------------------------------------------------------------------------+   |
|   |                            vigilai-scanner (CLI / GitHub Action)                           |   |
|   |                                                                                          |   |
|   |  +--------------------+  +----------------------+  +------------------+  +-------------+ |   |
|   |  |   Model Scanner    |  |     AST Analyzer     |  |   MCP Auditor    |  | AIBOM /     | |   |
|   |  | (pickletools PVM)  |  |  (Taint Tracking)    |  |  (.mcp-lock.json)|  | SARIF Engine| |   |
|   |  +--------------------+  +----------------------+  +------------------+  +-------------+ |   |
|   +------------------------------------------------------------------------------------------+   |
+-------------------------------------------------|------------------------------------------------+
                                                  | HTTP POST /api/v1/scans/submit
                                                  | (SARIF v2.1.0 + Graph DAG + CycloneDX 1.6 AIBOM)
                                                  v
+--------------------------------------------------------------------------------------------------+
|                                  VIGILAI CONTROL PLANE (BACKEND)                               |
|                                                                                                  |
|   +------------------------------------------------------------------------------------------+   |
|   |                           vigilai-server (FastAPI / PostgreSQL)                            |   |
|   |                                                                                          |   |
|   |  +------------------------------------------------------------------------------------+  |   |
|   |  |                               AI Quality Gate Engine                               |  |   |
|   |  |  - Static Rule Verifier (0 Critical ASI01-ASI10 Flaws)                              |  |   |
|   |  |  - Untrusted Source -> Sensitive Tool Taint Path Check                            |  |   |
|   |  |  - Model SafeTensors / Tensor Allowlist Validator                                  |  |   |
|   |  |  - Dynamic Red-Team Attack Success Rate (ASR == 0.00%)                             |  |   |
|   |  +------------------------------------------------------------------------------------+  |   |
|   +---------------------------------------|--------------------------------------------------+   |
+-------------------------------------------|------------------------------------------------------+
                         |                  |                                ^
                         | Reads Workload   | Syncs Findings                 | Posts Dynamic
                         | Specs & Tools    | & DAG Topologies               | Pentest Findings
                         v                  v                                | (ASR, Exploit Traces)
+------------------------------------+  +------------------------------------+---------------------+
|      vigilai-console (UI Portal)     |  |           vigilai-redteam (Dynamic Testing Daemon)         |
|         (Next.js + React Flow)     |  |                                                         |
|                                    |  |  +----------------------------------------------------+  |
|  - Fleet AI Workload Portfolio     |  |  |            Adversarial Simulation Harness          |  |
|  - Interactive Workflow DAG Viewer |  |  |  - Indirect Prompt Injection (IPI Probes)          |  |
|  - Real-time Taint Path Highlighting| |  |  - Tool Chaining & Exfiltration Emulation          |  |
|  - 1-Click Remediation Copy        |  |  |  - Deterministic Environment & State Assertions    |  |
|  - CycloneDX AIBOM Exporter        |  |  +----------------------------------------------------+  |
+------------------------------------+  +---------------------------------------------------------+

## Endpoint-only onboarding

The console can submit an agent URL directly to `POST /api/v1/endpoints/onboard`. The control plane performs bounded, read-only GET discovery against the supplied endpoint and its origin's `/openapi.json`, without following redirects or executing agent prompts. It then derives framework hints, API operation schemas, a graph topology, and a CycloneDX endpoint AIBOM before persisting the workload through the same quality-gate path used by CLI source scans. Localhost endpoints that are inaccessible from the server container are retried through `host.docker.internal`; explicit red-team probes remain user-triggered and run separately through the worker.

## Quality-gate evidence presentation

Workload detail responses recompute deterministic gate reasons from stored findings, topology, and attack-success rate, and attach the latest persisted `PentestRun` evidence. The console renders all static findings with supplied remediation or a clearly labelled advisory fallback, and failed dynamic episodes with guidance based on observed tool or network violations, relevant references, and expandable traces. Guidance is not an automatically generated or verified patch; operators must apply and retest changes.

## Workload and membership lifecycle

`DELETE /api/v1/workloads/{workload_id}` performs an explicit cascading application-level cleanup. It removes all associated `Scan`, `PentestRun`, and `PentestRequest` records, removes the workload identifier from every project, refreshes affected project timestamps, and finally deletes the workload. The console requires confirmation and explains the affected evidence before calling this operation. `DELETE /api/v1/teams/{team_id}/members/{member_id}` removes only the selected membership; projects and the team remain intact.

## Console information architecture

The console uses an enterprise SaaS workspace pattern inspired by SaaSFrame's dashboard, table, sidebar-navigation, data-grid, status-indicator, and security/compliance collections. A responsive persistent sidebar separates global navigation from workload content; the fleet page combines bento posture metrics with a searchable and status-filterable inventory; workload pages group identity, actions, metrics, gate evidence, and topology into distinct operational surfaces. The implementation preserves VigilAI's own branding, accessibility labels, responsive behavior, and existing workflows rather than copying any third-party screen.

## Project and team governance

VigilAI adds a SonarQube-inspired ownership layer above individual workloads:

```text
Team
|-- members (OWNER / ADMIN / MAINTAINER / ANALYST / VIEWER metadata)
`-- Projects
    |-- visibility and repository binding metadata
    |-- quality-gate policy name
    `-- Workloads (endpoint or source-scan registrations)
```

`Team`, `TeamMember`, and `Project` are independent persistent records so existing workload databases can adopt the feature through table creation without rewriting the workload table. A project stores workload identifiers and the API validates every association. Project responses compute their state from live workload records: any failed workload fails the project, all-passing workloads pass it, and empty or mixed/unknown portfolios remain unknown. The displayed project risk is the maximum attached workload risk.

The first release supports manual project creation, provider/repository metadata, team ownership, invitations, member removal, and workload attachment through REST and the console. Team roles describe intended responsibility but are not authorization controls because the console currently uses one shared operator identity rather than per-member accounts. Provider OAuth/import, permission templates, organization-wide SSO, and enforced RBAC remain future work.

## Console authentication

The public product landing page is served at `/`, while the fleet console lives at `/console`. The Next.js console protects application routes with `src/proxy.ts`. Unauthenticated navigation is redirected to `/login`; successful authentication creates an eight-hour HTTP-only, SameSite=Lax cookie containing a signed, expiring session payload. The HMAC signing key, username, and password are read only from server environment variables supplied by the root `.env` through Docker Compose. Logout expires the cookie immediately. The cookie's Secure flag is environment-controlled so local HTTP development works while HTTPS deployments can require secure transport.

The FastAPI control plane also requires a separately configured bearer token for API operations; health checks remain public. Compose binds the API port to loopback. The console forwards authenticated browser requests through a same-origin proxy, while the worker and CLI use the token from their environment. Endpoint discovery and the worker restrict outbound destinations to explicitly configured hostnames and do not follow redirects. An opt-in Kubernetes egress policy restricts appropriately labelled server and worker pods to DNS, the control plane and labelled in-namespace test agents. Its enforcement depends on the deployment's CNI and other additive policies, and it is not applied by Compose. Team roles remain governance metadata and are not yet connected to per-user authorization; this shared-token design is not multi-tenant authorization.

For console mutations, the proxy validates the browser's Origin against the exact `VIGILAI_PUBLIC_ORIGIN` configured for a hosted domain. Without that setting it accepts only matching loopback HTTP origins. This avoids relying on the internal Next.js server hostname behind a proxy. The Vercel project root is `packages/vigilai-console`; its API, persistent database and polling worker require separately provisioned services or additional deployment integration.

Endpoint-only discovery reports an inconclusive gate because it cannot inspect source or model artifacts. The worker requires structured tool and network trace arrays; incomplete evidence and failed assessments become inconclusive unless independent blocking evidence already fails the gate. Existing stored endpoint-only and incomplete results are re-evaluated on reads. The public playground is simulation-only and cannot send requests to user-provided URLs.

## Deterministic test-agent laboratory

The optional `test-agents` Compose profile runs a FastAPI fixture service on host loopback port 9000. Each profile supplies GET discovery, OpenAPI metadata, and the POST contract expected by the red-team worker (`prompt`, `context`, and `test_mode`). Responses expose deterministic `tool_invocations`, `network_requests`, and `blocked_actions` evidence.

The four profiles cover context isolation, simulated shell misuse, simulated RAG data exfiltration, and human-approval-gated mutation. Vulnerable evidence is emitted only in explicit test mode and is always marked `simulated`; no command execution, database mutation, email, or outbound request occurs. This provides repeatable positive and negative gate cases without an LLM or API key. The host binding is `127.0.0.1` to prevent LAN exposure, while Docker workloads reach it through `host.docker.internal` after VigilAI's localhost translation.
