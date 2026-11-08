Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$python = Join-Path $root '.venv-examples\Scripts\python.exe'
$model = if ($env:OLLAMA_MODEL) { $env:OLLAMA_MODEL } else { 'gpt-oss:20b' }
$ollamaUrl = if ($env:OLLAMA_URL) { $env:OLLAMA_URL.TrimEnd('/') } else { 'http://127.0.0.1:11434' }

try {
    try { $catalog = Invoke-RestMethod "$ollamaUrl/api/tags" -TimeoutSec 5 } catch {
        throw 'Cannot reach Ollama. Start Ollama and run this command again.'
    }
    if (-not @($catalog.models | Where-Object { $_.name -eq $model }).Count) {
        throw "Ollama model '$model' is not installed. Install it with ollama pull or set OLLAMA_MODEL to an installed model."
    }
    if (-not (Test-Path -LiteralPath $python)) {
        if (-not (Get-Command py -ErrorAction SilentlyContinue)) { throw 'Python 3 is required. Install Python and run this command again.' }
        & py -3 -m venv (Join-Path $root '.venv-examples')
        if ($LASTEXITCODE -ne 0) { throw 'Could not create the example Python environment.' }
    }
    # Check without emitting an import traceback: Windows PowerShell can treat
    # redirected native stderr as a terminating error before checking exit code.
    & $python -c 'import importlib.util, sys; sys.exit(0 if all(importlib.util.find_spec(n) for n in sys.argv[1:]) else 1)' fastapi httpx uvicorn
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Installing example dependencies...'
        & $python -m pip install -r (Join-Path $root 'examples\real_ai\requirements.txt')
        if ($LASTEXITCODE -ne 0) { throw 'Could not install the example dependencies.' }
    }
    Push-Location $root
    try {
        Write-Host "Using local Ollama model: $model"
        Write-Host 'Examples: http://localhost:9100/model, /agent, /workflow'
        Write-Host 'Keep this terminal open; press Ctrl+C to stop the examples.'
        & $python -m uvicorn examples.real_ai.main:app --app-dir $root --host 127.0.0.1 --port 9100
        if ($LASTEXITCODE -ne 0) { throw "The example service stopped with exit code $LASTEXITCODE. Check the output above." }
    } finally { Pop-Location }
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
