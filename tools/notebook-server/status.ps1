$ErrorActionPreference = 'Stop'

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $scriptRoot 'config.ps1'
if (-not (Test-Path $configPath)) {
    throw "Missing config.ps1. Copy config.example.ps1 before running this script."
}

. $configPath

$runtimeDirectory = Join-Path $scriptRoot 'runtime'
if (-not (Test-Path $runtimeDirectory)) {
    Write-Host 'No runtime directory found. Services have not been started yet.' -ForegroundColor DarkGray
    return
}

$logsDirectory = if ($LogsDirectory) { $LogsDirectory } else { Join-Path $ProjectRoot 'logs\notebook-server' }

function Show-ServiceStatus {
    param([string]$Key)

    $pidFile = Join-Path $runtimeDirectory "$Key.pid"
    if (-not (Test-Path $pidFile)) {
        Write-Host "${Key}: stopped" -ForegroundColor DarkGray
        return
    }

    $pidContent = Get-Content $pidFile | Select-Object -First 1
    if (-not $pidContent) {
        Write-Host "${Key}: pid file empty" -ForegroundColor Yellow
        return
    }

    $processId = 0
    if (-not [int]::TryParse($pidContent, [ref]$processId)) {
        Write-Host "${Key}: pid file invalid" -ForegroundColor Yellow
        return
    }

    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if (-not $process) {
        Write-Host "${Key}: stale pid ($processId)" -ForegroundColor Yellow
        return
    }

    $latestLog = $null
    if (Test-Path $logsDirectory) {
        $pattern = "$Key-*.log"
        $latestLog = Get-ChildItem -Path $logsDirectory -Filter $pattern -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    }

    if ($latestLog) {
        Write-Host "${Key}: running (PID $processId) | Log: $($latestLog.Name)" -ForegroundColor Green
    }
    else {
        Write-Host "${Key}: running (PID $processId)" -ForegroundColor Green
    }
}

Show-ServiceStatus -Key 'backend'
Show-ServiceStatus -Key 'relay'
Show-ServiceStatus -Key 'ngrok'
