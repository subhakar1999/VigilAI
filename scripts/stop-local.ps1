# Stop this project's Compose services and its locally launched AI examples.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
$failed = $false

if (Get-Command docker -ErrorAction SilentlyContinue) {
    Push-Location $projectDirectory
    try {
        # Compose requires this setting to parse the file, even for `stop`.
        # This process-local placeholder is never used to recreate containers.
        $env:VIGILAI_API_TOKEN = 'stop-only-placeholder-not-a-credential'
        & docker compose --profile redteam --profile test-agents stop
        if ($LASTEXITCODE -ne 0) {
            Write-Warning 'Docker Compose could not stop or check the VigilAI containers.'
            $failed = $true
        }
    } catch {
        Write-Warning 'Docker Compose could not stop or check the VigilAI containers.'
        $failed = $true
    } finally { Pop-Location }
} else {
    Write-Warning 'Docker is not available, so VigilAI container status could not be checked.'
    $failed = $true
}

try {
    $listeners = @(Get-NetTCPConnection -LocalPort 9100 -State Listen -ErrorAction SilentlyContinue)
    foreach ($listener in $listeners) {
        $processId = [int]$listener.OwningProcess
        $process = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction Stop
        $commandLine = [string]$process.CommandLine
        if ($commandLine -match '(?i)(?:^|\s)-m\s+uvicorn\s+examples\.real_ai\.main:app(?:\s|$)' -and
            $commandLine -match '(?i)(?:^|\s)--app-dir(?:\s|=)' -and
            $commandLine.IndexOf($projectDirectory, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
            Stop-Process -Id $processId -ErrorAction Stop
            Write-Host 'Stopped the local VigilAI AI example service.'
        } else {
            Write-Host "Port 9100 belongs to another process (PID $processId); left it running."
        }
    }
    if ($listeners.Count -eq 0) { Write-Host 'The local VigilAI AI example service is not running.' }
} catch {
    Write-Warning 'Could not verify or stop the local AI example service.'
    $failed = $true
}

if ($failed) { exit 1 }
Write-Host 'VigilAI services are stopped. Saved data and the shared Ollama service were left in place.'
