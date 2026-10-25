# VigilAI

**The Open-Source Security & Quality Gate Platform for AI Models, Agents, and Workflows.**

VigilAI brings the developer experience of SonarQube to the agentic AI era. It unifies pre-commit model weight inspection, static agent AST taint analysis, MCP tool supply-chain auditing, interactive workflow DAG visualization, and automated red-team dynamic pentesting.

```
       [ vigilai-scanner (CLI) ]
                  │
        (SARIF + Graph + AIBOM)
                  ▼
     [ vigilai-server (Quality Gate) ] ◄─── [ vigilai-redteam (Pentest Worker) ]
                  │
                  ▼
   [ vigilai-console (Visual Portal) ]
```

---

## Key Features

- **Symbolic Model Byte-Stream Scanner (`Layer 1`)**: Inspects `.pt`, `.bin`, and `.joblib` checkpoints via symbolic Pickle Virtual Machine (`pickletools.genops`) emulation. Blocks unpickling RCE gadgets, extension registry mutations (`copyreg`), and malformed `STACK_GLOBAL` bypasses without loading weights.
- **Agent AST & Taint Tracking Engine (`Layer 3`)**: Automatically flags untrusted `@tool` inputs and LLM outputs flowing into high-consequence sinks (`eval`, `subprocess`, `cursor.execute`, `vector_store.upsert`). Enforces `max_iterations` recursion limits and human approval gates.
- **MCP Supply Chain Auditor & Pinning (`Layer 7`)**: Detects tool poisoning and tool shadowing in `mcp.json`. Enforces `.mcp-lock.json` content-hash pinning against runtime MCP rug-pull attacks.
- **Deterministic AI Quality Gates**: Blocks PR merges in CI/CD when critical OWASP Agentic Top 10 (`ASI01`–`ASI10`) vulnerabilities, unvalidated taint paths, or dynamic attack bypasses exist.
- **Interactive Workflow DAG (`React Flow`)**: Visualizes data propagation from input sources to tools, animates tainted pathways in red, exports CycloneDX AIBOMs, and provides one-click remediation copying.
- **Autonomous Dynamic Red-Team Agent**: Conducts multi-turn indirect prompt injection (IPI) and tool-chaining simulations against running agents, validating defenses with deterministic assertions.
- **Enterprise Compliance Out-of-the-Box**: Native **SARIF v2.1.0** export for GitHub Code Scanning and cryptographically signed **CycloneDX 1.6+ AIBOM** reports for EU AI Act and NIST readiness.

---

## Monorepo Architecture

| Package | Directory | Tech Stack | Purpose |
| :--- | :--- | :--- | :--- |
| **`vigilai-scanner`** | `/packages/vigilai-scanner` | Python 3.11+, Typer, AST | Local CLI & CI/CD static scanning sensor |
| **`vigilai-server`** | `/packages/vigilai-server` | FastAPI, SQLModel, PostgreSQL | Central API, inventory, and AI Quality Gate engine |
| **`vigilai-console`** | `/packages/vigilai-console` | Next.js 16, React Flow, Tailwind | Visual fleet management & workflow graph viewer |
| **`vigilai-redteam`** | `/packages/vigilai-redteam` | Python 3.11+, HTTPX, AsyncIO | Dynamic pentesting & adversarial probe runner |

---

## Quickstart

### 1. Run the Control Plane (Server + Console)
Spin up the local backend, database, and dashboard via Docker Compose:

```bash
git clone [https://github.com/your-org/vigilai.git](https://github.com/your-org/vigilai.git)
cd vigilai
docker-compose up -d
```

- **VigilAI Web Console**: `http://localhost:3000`
- **FastAPI Control Plane**: `http://localhost:8000/docs`

To onboard a running agent without local source code, open the console, select **Add endpoint**, and enter the agent URL plus an optional name. VigilAI performs bounded read-only discovery, imports available OpenAPI operations, creates an endpoint topology and CycloneDX AIBOM, and registers the workload for explicit dynamic testing. When VigilAI runs in Docker, a submitted `localhost` URL is automatically retried through `host.docker.internal`.

---

### 2. Install & Run the CLI Scanner

Install the scanner locally:
```bash
pip install -e packages/vigilai-scanner
```

#### Run a Local Scan
Scan your local repository for model risks, unsafe `@tool` functions, and MCP misconfigurations:
```bash
vigilai scan .
```

#### Generate an MCP Hash Lockfile
Pin all configured MCP tool schemas to prevent post-approval rug-pull modifications:
```bash
vigilai mcp-lock .
```

#### Onboard a Workload to the Visual Board
Scan your codebase and register it with the centralized control plane:
```bash
vigilai onboard . --server http://localhost:8000 --name "customer-support-agent" --endpoint http://localhost:9000/vigilai-test
```

Alternatively, provide only a live endpoint. The workload name is inferred from OpenAPI metadata when `--name` is omitted:

```bash
vigilai onboard --server http://localhost:8000 --endpoint http://localhost:9000/vigilai-test
```

Endpoint-only onboarding discovers reachable HTTP status, framework hints, OpenAPI routes, request schemas, and API operations. Static source, model-weight, prompt-file, and MCP configuration findings require the source-scan form of the command because those artifacts cannot be recovered reliably from a black-box HTTP endpoint.

Open `http://localhost:3000` to view the interactive execution graph, inspect active taint paths, and check your AI Quality Gate status.

---

### 3. Run Dynamic Red-Team Pentesting

Trigger automated indirect prompt injection and tool misuse simulations against a deployed agent:
```bash
cd packages/vigilai-redteam
python -m redteam.daemon run --server http://localhost:8000 --workload-id "WORKLOAD_ID"
```

The dynamic evaluation suite tests tool boundaries. If an injection successfully triggers an unauthorized tool invocation, the Attack Success Rate (ASR) rises above 0.00%, the compromised nodes turn red on the visual canvas, and the Quality Gate shifts to **FAILED**.

Dynamic testing posts `prompt`, `context`, and `test_mode` fields to the registered endpoint. For deterministic tool and network-policy evaluation, the endpoint should return a `trace` object containing `tool_invocations` and `network_requests`; endpoint discovery itself sends only bounded GET requests and never starts probes automatically.

For queued execution, start the worker and use **Run pentest** on a workload page:

```bash
python -m redteam.daemon watch --server http://localhost:8000
```

The optional Compose profile starts the same polling worker alongside the control plane:

```bash
docker compose --profile redteam up --build
```

---

## CI/CD Integration: GitHub Actions

Add VigilAI directly to your pull-request pipeline to fail builds introducing unvalidated taint paths:

```yaml
name: VigilAI AI Security Scan

on:
  pull_request:
    branches: [ main ]

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install VigilAI Scanner
        run: pip install packages/vigilai-scanner

      - name: Run Scan & Export SARIF
        run: |
          vigilai scan . --output results.sarif --fail-on-gate

      - name: Upload SARIF to GitHub Code Scanning
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif
```

---

## Mapping to Industry Standards

- **OWASP Top 10 for Agentic Applications (2026)**: Full coverage across `ASI01` (Goal Hijack) through `ASI10` (Rogue Agents).
- **CSA MAESTRO Framework**: Evaluates all 7 layers (Foundation Models, Data Operations, Frameworks, Infrastructure, Observability, Security/IAM, and Ecosystem).
- **MITRE ATLAS**: Maps findings directly to techniques including `AML.T0018.002` (Pickle Deserialization) and `AML.T0054` (Tool Hijacking).
- **CycloneDX 1.6+**: Generates standardized AI Bills of Materials (AIBOM) for EU AI Act compliance.

---

## License
Apache 2.0 License. See `LICENSE` for details.

---

## Local Development

Install the three Python packages into one Python 3.11+ virtual environment and install the console dependencies:

```bash
pip install -e "packages/vigilai-scanner" -e "packages/vigilai-server[test]" -e "packages/vigilai-redteam[test]"
cd packages/vigilai-console && npm install
```

Run the verification suite from the repository root:

```bash
pytest
cd packages/vigilai-console && npm run typecheck && npm run build
```

For an integrated local environment, run `docker compose up --build`. API documentation is available at `http://localhost:8000/docs` and the console at `http://localhost:3000`. Stop the stack with `docker compose down`; the named data volume is preserved.

---

## Project Records

- [`PROGRESS.md`](PROGRESS.md) records implementation status, completed phases, verification results, limitations, and next work.
- [`FILE_CHANGES.md`](FILE_CHANGES.md) records every tracked file addition, removal, rename, and material modification.

Both records must be updated in the same change set as future implementation work.
