# VigilAI

VigilAI helps you inspect AI agents, model artifacts, and tool integrations for security risks. It combines a source scanner, an API, a dashboard, and a red-team worker.

> Current status: suitable for local evaluation. Login is shared between operators; team roles are labels, not enforced permissions. Tenant isolation, internet-facing security controls, and production operations are not complete. Do not use this as a multi-tenant SaaS yet.

## What you can do

- Add an agent endpoint to discover available HTTP and OpenAPI information.
- Scan local source code, supported model artifacts, and MCP configuration with the CLI.
- Queue test probes against an agent that implements the VigilAI trace contract.
- Review quality-gate results, evidence, and suggested remediation in the console.
- Organize registered workloads into projects and teams.

Endpoint discovery cannot inspect your agent's source code or model files. The playground and bundled test agents are simulations, not real security assessments of a production agent.

## How the parts fit together

| Part | Location | Purpose |
| --- | --- | --- |
| Console | `packages/vigilai-console` | Next.js landing page, login, and dashboard |
| Control plane | `packages/vigilai-server` | FastAPI, data storage, quality gates, and test queue |
| Scanner | `packages/vigilai-scanner` | Python CLI for source, model, and MCP scans |
| Red-team worker | `packages/vigilai-redteam` | Polls the queue and tests registered endpoints |
| Test agents | `packages/vigilai-test-agents` | Local, model-free fixtures for trying the workflow |

## Run locally with Docker

You need Docker Desktop with its engine running, Git, and a terminal. On Windows, the quickest way to start the console, API, worker, and test agents is:

```powershell
.\Start-Local.cmd
```

Run this from the repository folder. On first launch it creates an ignored `.env` file with the username `admin` and a randomly generated password and secrets. Open `.env` to find the password; keep the file private. If `.env` already exists, the launcher preserves it and checks the required settings. The first build may take several minutes. Then open [http://localhost:3000/console](http://localhost:3000/console).

If Docker Desktop is not installed or its engine is not running, start it first and run the command again. The launcher does not install Docker. The CLI scanner is optional and is installed separately below.

The manual setup is also available:

1. Clone the repository and enter its folder:

   ```powershell
   git clone https://github.com/subhakar1999/VigilAI.git
   cd VigilAI
   ```

2. Create the local settings file:

   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

   Choose your own `VIGILAI_ADMIN_USERNAME` and `VIGILAI_ADMIN_PASSWORD`. Set `VIGILAI_AUTH_SECRET` and `VIGILAI_API_TOKEN` to **different random secrets**, each at least 32 characters. A way to generate one is:

   ```powershell
   [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLowerInvariant()
   ```

   Run it separately for each secret. Keep `.env` private; do not commit it. For local HTTP access leave `VIGILAI_COOKIE_SECURE=false` and `VIGILAI_PUBLIC_ORIGIN` unset.

3. Start the app, worker, and test agents:

   ```powershell
   docker compose --profile redteam --profile test-agents up -d --build
   ```

4. Open [http://localhost:3000](http://localhost:3000), select **Open console**, and sign in using the username and password in `.env`. The dashboard is at [http://localhost:3000/console](http://localhost:3000/console). The local API documentation is at [http://localhost:8000/docs](http://localhost:8000/docs).

To stop the services and keep saved data on Windows:

```powershell
.\Stop-Local.cmd
```

This stops the Compose services and the local AI example service started with `Start-AI-Examples.cmd`. It leaves Docker Desktop, the shared Ollama service, and saved data in place. If you started an example service manually, stop it in its own terminal with Ctrl+C.

Alternatively, stop just the Compose services with:

```powershell
docker compose --profile redteam --profile test-agents stop
```

To start them again, repeat the `up` command. Docker Compose stores the local database in a named volume. Do not delete that volume if you want to keep your records.

## Try a scan without an AI model

The bundled test agents return simulated traces. They do not run shell commands, send network requests, or modify real records.

1. In the console, select **Add agent**.
2. Enter one of these endpoints and a descriptive name.
3. Open the workload, select **Run pentest**, and refresh the page after the worker finishes.
4. Read the gate status, failure evidence, and suggested remediation.

| Fixture | Endpoint | Expected outcome |
| --- | --- | --- |
| Safe support | `http://localhost:9000/agents/safe-support` | No simulated exploit; gate remains **Inconclusive** without a source scan |
| Vulnerable shell | `http://localhost:9000/agents/vulnerable-shell` | **Failed**, with simulated unauthorized tool use |
| Vulnerable RAG | `http://localhost:9000/agents/vulnerable-exfiltration` | **Failed**, with simulated exfiltration evidence |
| Approval-gated orders | `http://localhost:9000/agents/approval-gated-orders` | No simulated exploit; gate remains **Inconclusive** without a source scan |

The fixture catalog is at [http://localhost:9000/catalog](http://localhost:9000/catalog). Results depend on the latest completed test. An **Inconclusive** result means required evidence is missing; it is not a pass.

## Try a real local model, agent, and workflow

The examples in `examples/real_ai` call a real model through Ollama. On the original development machine, Ollama already has `gpt-oss:20b` installed (about 13 GB). On another machine, install and start Ollama, then use `ollama list` to see your models. The launcher defaults to `gpt-oss:20b`; install it with `ollama pull gpt-oss:20b` if desired, or set `$env:OLLAMA_MODEL` to a model you already have. Model downloads can be large and are not automatic.

1. Start VigilAI with `.\Start-Local.cmd` and keep Docker Desktop running.
2. In a **second PowerShell window**, run `.\Start-AI-Examples.cmd`. The first run creates `.venv-examples` and installs the small web-service dependencies. It requires Python 3 and a running Ollama service. Keep this window open while testing; press Ctrl+C to stop the examples.
3. In the VigilAI console, select **Add agent** and enter any of these endpoints. Give each a different name:

   | Example | Endpoint | What it does |
   | --- | --- | --- |
   | Model | `http://localhost:9100/model` | Sends a prompt to the actual local language model. |
   | Agent | `http://localhost:9100/agent` | Uses the model to select an action; it may call a real read-only lookup over a sample order. |
   | Workflow | `http://localhost:9100/workflow` | Runs two model calls: summarize context, then answer. |

4. Open the workload, select **Run pentest**, and refresh after it finishes. A cold model can take time to load. Endpoint-only registrations remain **Inconclusive** when there is no blocking finding because the source and model artifacts have not been inspected.

You can also call the agent directly from another PowerShell window:

```powershell
$body = @{ prompt = 'What is the status of order VIGILAI-100?'; context = ''; test_mode = $true } | ConvertTo-Json
Invoke-RestMethod http://localhost:9100/agent -Method Post -ContentType 'application/json' -Body $body
```

The response includes the model answer and trace entries for real model requests and executed tools. The examples listen on localhost and are intended only for local testing. The agent permits only the sample read-only tool; it does not execute model-proposed shell commands or send data externally. The current red-team assertions check reported tool and network traces, **not** the content of the model's answers. A zero exploit count therefore does not establish that the model resisted prompt injection or is safe. Ollama's GGUF model weights are not inspected by the current pickle-based model scanner.

If a slow model times out, set `VIGILAI_PENTEST_TIMEOUT_SECONDS` in `.env` and recreate the worker; increase `VIGILAI_PENTEST_LEASE_TIMEOUT_SECONDS` for long multi-episode runs as needed. To use a different local Ollama API URL, set `$env:OLLAMA_URL` in the example-service terminal before starting it. The endpoint must be reachable from your machine; Vercel cannot reach your laptop's localhost.

## Scan your own code

Install Python 3.11 or later and the scanner from the repository root:

```powershell
py -m pip install -e packages/vigilai-scanner
vigilai scan .
```

The scanner writes `results.sarif`. To also register your source scan with the running control plane, set the token in your current terminal to the same value as `VIGILAI_API_TOKEN` in `.env`, then run:

```powershell
$env:VIGILAI_API_TOKEN = "paste-your-api-token-here"
vigilai onboard . --server http://localhost:8000 --name "my-agent"
```

To register a reachable agent endpoint as well, add `--endpoint http://localhost:9000/agents/safe-support`. Add non-local hostnames you own to `VIGILAI_ALLOWED_AGENT_HOSTS` in `.env`, then recreate the server and worker. An endpoint used for dynamic testing must accept `prompt`, `context`, and `test_mode` and return a trace containing `tool_invocations` and `network_requests` arrays. Test only agents you are authorized to assess.

## Deploy the console to Vercel

The Vercel project in this repository is the **Next.js console**. You also need a separately reachable control-plane API with persistent storage and a running worker; deploying the console alone does not provide them.

1. Push your reviewed changes to your Git repository and import it into Vercel.
2. Set the Vercel project **Root Directory** to `packages/vigilai-console`. Select the Next.js framework preset. The package's normal `npm run build` command builds the console.
3. Set these server-side environment variables in the Vercel project settings:

   | Variable | Value |
   | --- | --- |
   | `VIGILAI_ADMIN_USERNAME` | Your console username |
   | `VIGILAI_ADMIN_PASSWORD` | A strong, unique password |
   | `VIGILAI_AUTH_SECRET` | A random session-signing secret of at least 32 characters |
   | `VIGILAI_API_TOKEN` | An independent API token matching the control plane |
   | `VIGILAI_API_URL` | The HTTPS base URL of your deployed control plane, without a trailing slash |
   | `VIGILAI_PUBLIC_ORIGIN` | The exact browser origin, for example `https://app.example.com`, with no trailing slash or path |
   | `VIGILAI_COOKIE_SECURE` | `true` for HTTPS |

   Do not prefix these secrets with `NEXT_PUBLIC_`. Set `VIGILAI_PUBLIC_ORIGIN` separately for each domain or deployment environment; the current configuration permits one origin at a time.

4. Deploy the console. Open its HTTPS URL, sign in, and verify that the fleet loads and an authorized test endpoint can be added. A local `localhost` URL on your laptop is not reachable from Vercel.

The local Compose configuration uses SQLite on a Docker volume and is not a Vercel database. For a hosted API, use persistent storage appropriate to its host. The server's database URL is configurable, but PostgreSQL also requires a compatible Python driver and deployment validation; it is not configured by this guide. The polling worker needs a service designed for long-running jobs. Vercel offers Python Functions and beta Daemons, but this repository has not been configured or verified for deploying its API and worker with those products.

Before exposing any service publicly, add real per-user authentication and authorization, tenant isolation, secure API access, controlled network egress, observability, backups, and a reviewed deployment architecture. The included Kubernetes egress policy is an optional starting point that requires a supporting CNI and cluster-specific review; it has not been verified on a live cluster.

## Development and verification

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tests/start-local.test.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File tests/stop-local.test.ps1
py -m pip install -e packages/vigilai-scanner -e "packages/vigilai-server[test]" -e "packages/vigilai-redteam[test]" -e "packages/vigilai-test-agents[test]"
py -m pytest
cd packages/vigilai-console
npm install
npm run typecheck
node --test tests/*.test.cjs
npm run build
```

For more details see [System-design.md](System-design.md), [repo-layout.md](repo-layout.md), [PROGRESS.md](PROGRESS.md), and [FILE_CHANGES.md](FILE_CHANGES.md).

## License

Apache 2.0. See [LICENSE](LICENSE).
