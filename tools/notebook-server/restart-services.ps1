param(
    [switch]$SkipBackend,
    [switch]$SkipRelay,
    [switch]$SkipNgrok,
    [switch]$SkipFrontend
)

$ErrorActionPreference = 'Stop'

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$stopScript = Join-Path $scriptRoot 'stop-services.ps1'
$startScript = Join-Path $scriptRoot 'start-services.ps1'

if (-not (Test-Path $stopScript) -or -not (Test-Path $startScript)) {
    throw 'Required scripts not found in tools/notebook-server.'
}

$targets = @()
if (-not $SkipBackend) { $targets += 'backend' }
if (-not $SkipRelay) { $targets += 'relay' }
if (-not $SkipNgrok) { $targets += 'ngrok' }
if (-not $SkipFrontend) { $targets += 'frontend' }

if ($targets.Count -eq 0) {
    Write-Host 'Nothing to restart. All services were skipped.' -ForegroundColor DarkGray
    return
}

foreach ($target in $targets) {
    switch ($target) {
        'backend' { & $stopScript -BackendOnly }
        'relay' { & $stopScript -RelayOnly }
        'ngrok' { & $stopScript -NgrokOnly }
        'frontend' { & $stopScript -FrontendOnly }
    }
}

Start-Sleep -Seconds 2
& $startScript @PSBoundParameters

Write-Host 'Notebook server services restarted.' -ForegroundColor Cyan
