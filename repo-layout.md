# VigilAI repository layout

```text
VigilAI/
|-- Start-Local.cmd                     # Windows one-command launcher
|-- Stop-Local.cmd                      # Stop local VigilAI services
|-- Start-AI-Examples.cmd               # Run local model-backed examples
|-- scripts/start-local.ps1             # Local configuration and Compose startup
|-- scripts/stop-local.ps1              # Safe project-specific shutdown
|-- scripts/start-ai-examples.ps1       # Start examples with local Ollama
|-- tests/start-local.test.ps1          # Isolated launcher verification
|-- tests/stop-local.test.ps1           # Project-specific shutdown verification
|-- examples/real_ai/                  # Real model, read-only agent, workflow and tests
|-- deploy/kubernetes/egress-policy.yaml # Opt-in restricted egress policy
|-- .github/
|   `-- workflows/
|       `-- vigilai-scan.yml
|-- packages/
|   |-- vigilai-scanner/
|   |   |-- pyproject.toml
|   |   |-- vigilai/
|   |   |   |-- cli.py                 # Typer CLI and onboarding modes
|   |   |   |-- ast_visitor.py         # AST taint analysis and graph builder
|   |   |   |-- model_scanner.py       # Symbolic pickle/PVM inspection
|   |   |   |-- mcp_auditor.py         # MCP audit and lock generation
|   |   |   |-- uploader.py            # Scan and endpoint upload clients
|   |   |   `-- emitters/
|   |   |       |-- sarif.py
|   |   |       `-- aibom.py
|   |   `-- tests/
|   |-- vigilai-server/
|   |   |-- pyproject.toml
|   |   |-- app/
|   |   |   |-- main.py                # Control-plane API and queue routes
|   |   |   |-- endpoint_discovery.py  # Bounded HTTP/OpenAPI discovery
|   |   |   |-- endpoint_policy.py     # Allowed agent endpoint hosts
|   |   |   |-- auth.py                # Control-plane bearer token check
|   |   |   |-- models.py              # Persistent SQLModel records
|   |   |   |-- schemas.py             # Validated transport contracts
|   |   |   |-- quality_gate.py        # Deterministic quality gate
|   |   |   `-- database.py
|   |   `-- tests/
|   |-- vigilai-console/
|   |   |-- package.json
|   |   |-- src/
|   |   |   |-- app/
|   |   |   |   |-- api/auth/          # Login and logout session routes
|   |   |   |   |-- api/control/       # Authenticated control-plane proxy
|   |   |   |   |-- login/page.tsx     # Protected-workspace sign-in page
|   |   |   |   |-- page.tsx           # Public product landing page
|   |   |   |   |-- console/page.tsx   # Protected fleet inventory and endpoint entry
|   |   |   |   |-- projects/page.tsx  # Project portfolio and aggregate gates
|   |   |   |   |-- teams/page.tsx     # Team onboarding and membership
|   |   |   |   `-- workloads/[id]/page.tsx
|   |   |   `-- components/
|   |   |       |-- EndpointOnboardForm.tsx
|   |   |       |-- LoginForm.tsx
|   |   |       |-- ProjectCreateForm.tsx
|   |   |       |-- TeamDirectory.tsx
|   |   |       |-- GateFailureDetails.tsx
|   |   |       |-- FindingRemediation.tsx # Findings and evidence-specific guidance
|   |   |       |-- ConsoleShell.tsx
|   |   |       |-- WorkloadInventory.tsx
|   |   |       |-- WorkloadDeleteButton.tsx
|   |   |       |-- FlowGraph.tsx
|   |   |       |-- NodeDrawer.tsx
|   |   |       |-- ArtifactActions.tsx
|   |   |       `-- QualityGateBadge.tsx
|   |   |-- public/vigilai-logo.png     # Generated transparent primary brand mark
|   |   |-- public/vigilai-favicon-v2.png # Close-cropped high-contrast browser icon
|   |   |-- src/lib/auth.ts             # Credentials and signed sessions
|   |   |-- src/lib/origin.ts           # Public/local browser-origin validation
|   |   |-- src/proxy.ts                # Portal route protection
|   |   `-- Dockerfile
|   |-- vigilai-redteam/
|   |   |-- pyproject.toml
|   |   |-- redteam/
|   |   |   |-- daemon.py               # Durable queue worker
|   |   |   |-- harness.py              # Target execution and callbacks
|   |   |   |-- assertions.py
|   |   |   `-- probes/
|   |   `-- tests/
|   `-- vigilai-test-agents/
|       |-- pyproject.toml              # Fixture package and test dependencies
|       |-- Dockerfile                  # Local test-agent service image
|       |-- test_agents/main.py         # Four deterministic agent profiles
|       `-- tests/test_agent_endpoints.py
|-- docker-compose.yml
|-- .env.example                        # Safe authentication configuration template
|-- INSTRUCTIONS.md
|-- System-design.md
|-- PROGRESS.md
|-- FILE_CHANGES.md
`-- README.md
```
