# Instruction Prompt for Codex / Claude Code / Cursor

You are acting as a Senior Staff Systems Architect and Security Engineer. You are tasked with implementing **VigilAI**, an end-to-end security scanning, visual workflow, and dynamic pentesting platform for AI models, agents, and workflows.

Build the repository cleanly adhering to the specifications below. All code must be production-ready, fully typed, well-documented, and functional.

---

### 1. Technology Stack Requirements
- **CLI (`packages/vigilai-scanner`)**: Python 3.11+, `typer`, `ast`, `pickletools`, `pydantic`, `httpx`.
- **Backend API (`packages/vigilai-server`)**: Python 3.11+, `fastapi`, `uvicorn`, `sqlmodel` (or `sqlalchemy`), `pydantic`.
- **Frontend Dashboard (`packages/vigilai-console`)**: Next.js 14 (App Router), TypeScript, `@xyflow/react` (React Flow), Tailwind CSS, Lucide icons.
- **Red Team Worker (`packages/vigilai-redteam`)**: Python 3.11+, `httpx`, `asyncio`, `pytest`.

---

### 2. Core Implementation Phases

#### Phase 1: `vigilai-scanner` (The Sensor)
1. **`model_scanner.py`**:
   - Implement `SymbolicPVMScanner` using `pickletools.genops(data)`.
   - Disassemble pickle streams inside `.pt`, `.bin`, `.pkl`, and `.joblib` files.
   - Flag any callable not in a strict tensor allowlist (`torch._utils._rebuild_tensor_v2`, `FloatStorage`, `OrderedDict`).
   - Detect mutable extension mutations (`copyreg._inverted_registry`, `copyreg.add_extension`) followed by `EXT1`/`EXT2`/`EXT4` opcodes.
   - Wrap parsing in a fail-closed exception handler to block `STACK_GLOBAL` parser bypasses (EDP-1).
2. **`ast_visitor.py`**:
   - Traverse Python files using `ast.NodeVisitor`.
   - Identify tool functions decorated with `@tool` or `@mcp.tool` and mark all their arguments as tainted sources.
   - Identify LLM inference calls (`ChatCompletion.create`, `litellm.chat`, `.invoke`) and treat their return values as untrusted sources (Prompt-to-X pattern).
   - Trace intra-procedural assignments and 1-hop calls from tainted variables into dangerous execution sinks: `eval()`, `exec()`, `subprocess.run()`, `os.system()`, `cursor.execute()`, and vector store `.upsert()`.
   - Check structural guardrails: flag `AgentExecutor` or LangGraph loops missing `max_iterations`, and flag destructive tools missing `human_in_the_loop=True` or `checkpointer` gates.
   - Extract a node/edge workflow topology: `{id, label, category, file_path, line, is_vulnerable}` and `{source, target, is_tainted}`.
3. **`mcp_auditor.py`**:
   - Parse `mcp.json` and `claude_desktop_config.json`.
   - Audit tool descriptions for prompt injection directives and cross-server duplicate tool names (shadowing).
   - Implement `vigilai mcp-lock` command to hash server commands, arguments, and schemas into `.mcp-lock.json` (SHA-256).
4. **`emitters/sarif.py` & `emitters/aibom.py`**:
   - Output valid SARIF v2.1.0 referencing OWASP Agentic Top 10 (2026) IDs (`ASI01` to `ASI10`).
   - Output valid CycloneDX 1.6 ML-BOM JSON containing models, prompts, datasets, and MCP dependencies.
5. **`cli.py`**:
   - Provide CLI commands:
     - `vigilai scan [PATH]`: Runs local scan and emits terminal table + `results.sarif`.
     - `vigilai mcp-lock [PATH]`: Generates `.mcp-lock.json`.
     - `vigilai onboard [PATH] --server [URL] --name [NAME]`: Runs scan and posts payload to `vigilai-server`.

#### Phase 2: `vigilai-server` (The Control Plane & Quality Gate Engine)
1. **`models.py` & `database.py`**:
   - Define database models for `Workload`, `Scan`, and `PentestRun`.
   - Store workload metadata, SARIF findings, graph topology JSON, AIBOM JSON, and Quality Gate status.
2. **`quality_gate.py`**:
   - Implement deterministic Quality Gate logic:
     - Mark status as `FAILED` if any finding has severity `CRITICAL` or `HIGH`.
     - Mark status as `FAILED` if an edge marked `is_tainted=True` terminates at an unprotected `DANGEROUS_SINK` node.
     - Mark status as `FAILED` if dynamic pentest has `attack_success_rate > 0.00%`.
     - Otherwise, mark as `PASSED`.
3. **`main.py`**:
   - Expose REST endpoints:
     - `POST /api/v1/scans/submit`: Receives scan bundle, evaluates Quality Gate, and stores result.
     - `GET /api/v1/workloads`: Returns list of all onboarded workloads and their Quality Gate status.
     - `GET /api/v1/workloads/{id}`: Returns single workload with findings, graph topology, and pentest stats.
     - `POST /api/v1/pentest/callback`: Receives dynamic test execution logs, updates ASR, and marks compromised nodes.

#### Phase 3: `vigilai-console` (Visual Graph Dashboard)
1. **Overview Page (`src/app/page.tsx`)**:
   - Clean, modern dashboard table listing all AI workloads.
   - Columns: Workload Name, Framework (LangGraph/CrewAI), Quality Gate Badge (`PASSED` in green, `FAILED` in red), Risk Score, MCP Count, and Actions.
2. **Workload Graph View (`src/app/workloads/[id]/page.tsx`)**:
   - Render the Directed Acyclic Graph (DAG) using `@xyflow/react`.
   - Color code nodes:
     - Yellow: `TAINT_SOURCE` (user prompts, untrusted inputs)
     - Purple: `REASONING` (LLM inference, planning nodes)
     - Orange: `TOOL` (MCP tools, external integrations)
     - Red: `DANGEROUS_SINK` (vulnerable execution sinks)
   - Render tainted edges with red animated strokes.
   - Implement a right-hand slide-over drawer: clicking any node shows its file location, line number, violated OWASP rule ID, and suggested code remediation.

#### Phase 4: `vigilai-redteam` (Dynamic Security Assessment Worker)
1. **`harness.py` & `daemon.py`**:
   - Poll or accept webhook triggers for a target workload.
   - Fetch the workload's tool schemas and endpoint URL from `vigilai-server`.
2. **`probes/ipi_probes.py`**:
   - Generate test episodes simulating indirect prompt injection (e.g., hidden directives inside mock document retrieval or tool outputs).
   - Test tool parameter hijacking and unauthorized data exfiltration attempts.
3. **`assertions.py`**:
   - Use deterministic assertions (inspect raw tool invocation arguments and network destinations) to verify if forbidden sinks were reached.
   - Compute `attack_success_rate = (successful_exploits / total_episodes)`.
   - Post results back to `vigilai-server` via `POST /api/v1/pentest/callback`.

---

### 3. Execution Verification
Provide functional unit tests for:
1. Model scanner detecting an unsafe `__reduce__` exploit in a mock pickle stream.
2. AST visitor detecting untrusted `@tool` input reaching `subprocess.run(shell=True)`.
3. Quality Gate engine failing a pull request on tainted sink paths.
4. Red Team harness recording a bypass and triggering the Quality Gate failure.