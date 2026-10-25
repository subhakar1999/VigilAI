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
