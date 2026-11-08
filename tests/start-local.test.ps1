Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repository = Split-Path -Parent $PSScriptRoot
$temporaryRoot = Join-Path $repository ("launcher-test-" + [guid]::NewGuid().ToString('N'))
$calls = [System.Collections.Generic.List[string]]::new()

function global:docker {
    $global:LASTEXITCODE = 0
    [void]$calls.Add(($args -join ' '))
}

try {
    [void](New-Item -ItemType Directory -Path (Join-Path $temporaryRoot 'scripts') -Force)
    Copy-Item -LiteralPath (Join-Path $repository 'scripts/start-local.ps1') -Destination (Join-Path $temporaryRoot 'scripts/start-local.ps1')
    $launcher = Join-Path $temporaryRoot 'scripts/start-local.ps1'
    $environmentFile = Join-Path $temporaryRoot '.env'

    & $launcher
    if (-not (Test-Path -LiteralPath $environmentFile)) { throw 'First run did not create .env.' }
    $firstRun = Get-Content -LiteralPath $environmentFile -Raw
    $matches = [regex]::Matches($firstRun, '(?m)^VIGILAI_(ADMIN_PASSWORD|AUTH_SECRET|API_TOKEN)=([a-f0-9]+)\s*$')
    if ($matches.Count -ne 3) { throw 'First run did not generate all credentials.' }
    $generated = @($matches | ForEach-Object { $_.Groups[2].Value })
    if (($generated | Select-Object -Unique).Count -ne 3 -or $generated[0].Length -lt 32 -or $generated[1].Length -lt 32 -or $generated[2].Length -lt 32) {
        throw 'Generated credentials must be distinct and sufficiently long.'
    }

    & $launcher
    if ((Get-Content -LiteralPath $environmentFile -Raw) -cne $firstRun) { throw 'Existing .env was changed on the second run.' }
    if (@($calls | Where-Object { $_ -eq 'compose --profile redteam --profile test-agents up -d --build' }).Count -ne 2) {
        throw 'The full Compose stack was not started on both runs.'
    }
    Write-Host 'Launcher test passed: first-run credentials, existing configuration, and Compose profiles.'
} finally {
    Remove-Item Function:\docker -ErrorAction SilentlyContinue
    if (Test-Path -LiteralPath $temporaryRoot) {
        $resolvedRoot = (Resolve-Path -LiteralPath $temporaryRoot).Path
        if ($resolvedRoot -ne $temporaryRoot) { throw 'Temporary test path did not resolve as expected.' }
        Remove-Item -LiteralPath $resolvedRoot -Recurse -Force
    }
}
