param(
    [switch]$BackendOnly,
    [switch]$RelayOnly,
    [switch]$NgrokOnly,
    [switch]$FrontendOnly
)

$ErrorActionPreference = 'Stop'

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $scriptRoot 'config.ps1'
if (-not (Test-Path $configPath)) {
    throw "Missing config.ps1. Copy config.example.ps1 before running this script."
}

. $configPath

$runtimeDirectory = Join-Path $scriptRoot 'runtime'
if (-not (Test-Path $runtimeDirectory)) {
    Write-Host 'No runtime directory found. Nothing to stop.' -ForegroundColor DarkGray
    return
}

$targets = @()
if ($BackendOnly -or $RelayOnly -or $NgrokOnly -or $FrontendOnly) {
    if ($BackendOnly) { $targets += 'backend' }
    if ($RelayOnly) { $targets += 'relay' }
    if ($NgrokOnly) { $targets += 'ngrok' }
    if ($FrontendOnly) { $targets += 'frontend' }
}
else {
    $targets = @('backend', 'relay', 'ngrok', 'frontend')
}

function Stop-ManagedProcess {
    param([string]$Key)

    $pidFile = Join-Path $runtimeDirectory "$Key.pid"
    if (-not (Test-Path $pidFile)) {
        Write-Host "$Key is not running (no pid file)." -ForegroundColor DarkGray
        return
    }

    $pidContent = Get-Content $pidFile | Select-Object -First 1
    if (-not $pidContent) {
        Write-Host "$Key pid file empty. Cleaning up." -ForegroundColor Yellow
        Remove-Item $pidFile -Force
        return
    }

    $processId = 0
    if (-not [int]::TryParse($pidContent, [ref]$processId)) {
        Write-Host "$Key pid file invalid. Cleaning up." -ForegroundColor Yellow
        Remove-Item $pidFile -Force
        return
    }

    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if (-not $process) {
        Write-Host "$Key process not found. Removing stale pid file." -ForegroundColor DarkGray
        Remove-Item $pidFile -Force
        return
    }

    try {
        Stop-Process -Id $processId -Force -ErrorAction Stop
        Write-Host "$Key stopped (PID $processId)." -ForegroundColor Cyan
    }
    catch {
        Write-Host "Failed to stop $Key (PID $processId): $($_.Exception.Message)" -ForegroundColor Red
        return
    }

    Remove-Item $pidFile -Force
}

foreach ($target in $targets) {
    Stop-ManagedProcess -Key $target
}

Write-Host 'Notebook server services stopped.' -ForegroundColor Cyan
