Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repository = Split-Path -Parent $PSScriptRoot
$stopped = [System.Collections.Generic.List[int]]::new()
$dockerCalls = [System.Collections.Generic.List[string]]::new()

function global:docker {
    $global:LASTEXITCODE = 0
    [void]$dockerCalls.Add(($args -join ' '))
}
function global:Get-NetTCPConnection {
    [CmdletBinding()]
    param($LocalPort, $State)
    [pscustomobject]@{ OwningProcess = 101 }
    [pscustomobject]@{ OwningProcess = 202 }
}
function global:Get-CimInstance {
    [CmdletBinding()]
    param($ClassName, $Filter)
    if ($Filter -match '101') {
        return [pscustomobject]@{ CommandLine = "python -m uvicorn examples.real_ai.main:app --app-dir `"$repository`" --host 127.0.0.1 --port 9100" }
    }
    return [pscustomobject]@{ CommandLine = 'python -m uvicorn unrelated.app:app --port 9100' }
}
function global:Stop-Process {
    [CmdletBinding()]
    param([int]$Id)
    [void]$stopped.Add($Id)
}

try {
    & (Join-Path $repository 'scripts/stop-local.ps1')
    if ($stopped.Count -ne 1 -or $stopped[0] -ne 101) { throw 'Stop command did not isolate the project example process.' }
    if (-not $dockerCalls.Contains('compose --profile redteam --profile test-agents stop')) { throw 'Stop command did not address all Compose profiles.' }
    Write-Host 'Stop launcher test passed: project process stopped; unrelated process preserved.'
} finally {
    Remove-Item Function:\docker, Function:\Get-NetTCPConnection, Function:\Get-CimInstance, Function:\Stop-Process -ErrorAction SilentlyContinue
}
