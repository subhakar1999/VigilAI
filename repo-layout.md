# VigilAI repository layout

```text
VigilAI/
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
|   |   |   |-- models.py              # Persistent SQLModel records
|   |   |   |-- schemas.py             # Validated transport contracts
|   |   |   |-- quality_gate.py        # Deterministic quality gate
|   |   |   `-- database.py
|   |   `-- tests/
|   |-- vigilai-console/
|   |   |-- package.json
|   |   |-- src/
|   |   |   |-- app/
|   |   |   |   |-- page.tsx           # Fleet inventory and endpoint entry
|   |   |   |   `-- workloads/[id]/page.tsx
|   |   |   `-- components/
|   |   |       |-- EndpointOnboardForm.tsx
|   |   |       |-- FlowGraph.tsx
|   |   |       |-- NodeDrawer.tsx
|   |   |       |-- ArtifactActions.tsx
|   |   |       `-- QualityGateBadge.tsx
|   |   `-- Dockerfile
|   `-- vigilai-redteam/
|       |-- pyproject.toml
|       |-- redteam/
|       |   |-- daemon.py               # Durable queue worker
|       |   |-- harness.py              # Target execution and callbacks
|       |   |-- assertions.py
|       |   `-- probes/
|       `-- tests/
|-- docker-compose.yml
|-- INSTRUCTIONS.md
|-- System-design.md
|-- PROGRESS.md
|-- FILE_CHANGES.md
`-- README.md
```
