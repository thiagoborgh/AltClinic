param(
    [switch]$SkipBackend,
    [switch]$SkipRelay,
    [switch]$SkipNgrok,
    [switch]$SkipFrontend
)

$ErrorActionPreference = 'Stop'

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $scriptRoot 'config.ps1'
if (-not (Test-Path $configPath)) {
    throw "Missing config.ps1. Copy config.example.ps1 and adjust paths before running this script."
}

. $configPath

if (-not $ProjectRoot -or -not (Test-Path $ProjectRoot)) {
    throw "ProjectRoot is not configured correctly in config.ps1."
}

function Resolve-Binary {
    param(
        [string]$BinaryName,
        [string]$ConfiguredPath
    )

    if ($ConfiguredPath -and (Test-Path $ConfiguredPath)) {
        return $ConfiguredPath
    }

    $command = Get-Command $BinaryName -ErrorAction SilentlyContinue
    if (-not $command) {
        throw "Unable to locate $BinaryName. Update config.ps1 with the full path."
    }

    return $command.Source
}

function Ensure-Directory {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

$logsDirectory = if ($LogsDirectory) { $LogsDirectory } else { Join-Path $ProjectRoot 'logs\notebook-server' }
Ensure-Directory -Path $logsDirectory

$runtimeDirectory = Join-Path $scriptRoot 'runtime'
Ensure-Directory -Path $runtimeDirectory

$script:NodeBinary = $null
$script:NgrokBinary = $null

function Get-NodeBinary {
    if (-not $script:NodeBinary) {
        $script:NodeBinary = Resolve-Binary -BinaryName 'node' -ConfiguredPath $NodeExecutable
    }

    return $script:NodeBinary
}

function Get-NgrokBinary {
    if (-not $script:NgrokBinary) {
        $script:NgrokBinary = Resolve-Binary -BinaryName 'ngrok' -ConfiguredPath $NgrokExecutable
    }

    return $script:NgrokBinary
}

function New-LogFile {
    param([string]$Prefix)

    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    return Join-Path $logsDirectory "$Prefix-$timestamp.log"
}

function Start-ManagedProcess {
    param(
        [string]$Key,
        [string]$CommandLine,
        [string]$WorkingDirectory
    )

    $pidFile = Join-Path $runtimeDirectory "$Key.pid"

    if (Test-Path $pidFile) {
        $existingPid = Get-Content $pidFile | Select-Object -First 1
        if ($existingPid) {
            $process = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "$Key already running (PID $existingPid)" -ForegroundColor Yellow
                return
            }

            Remove-Item $pidFile -Force
        }
    }

    $logFile = New-LogFile -Prefix $Key
    Add-Content -Path $logFile -Value "=== $(Get-Date -Format 'u') :: starting $Key ==="

    $command = "cd /d `"$WorkingDirectory`" && $CommandLine >> `"$logFile`" 2>&1"
    $process = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $command -WindowStyle Hidden -PassThru

    $process.Id | Set-Content -Path $pidFile
    Write-Host "$Key started (PID $($process.Id)). Log: $logFile" -ForegroundColor Green
}

if (-not $SkipBackend) {
    $backendScriptPath = Join-Path $ProjectRoot $BackendEntrypoint
    if (-not (Test-Path $backendScriptPath)) {
        throw "BackendEntrypoint not found at $backendScriptPath"
    }

    $backendCommand = "`"$(Get-NodeBinary)`" `"$backendScriptPath`""
    Start-ManagedProcess -Key 'backend' -CommandLine $backendCommand -WorkingDirectory $ProjectRoot
}
else {
    Write-Host 'Skipping backend (per parameter).' -ForegroundColor DarkGray
}

if (-not $SkipRelay) {
    $relayScriptPath = Join-Path $ProjectRoot $EmailRelayScript
    if (-not (Test-Path $relayScriptPath)) {
        throw "EmailRelayScript not found at $relayScriptPath"
    }

    $relayCommand = "`"$(Get-NodeBinary)`" `"$relayScriptPath`""
    Start-ManagedProcess -Key 'relay' -CommandLine $relayCommand -WorkingDirectory $ProjectRoot
}
else {
    Write-Host 'Skipping email relay (per parameter).' -ForegroundColor DarkGray
}

if (-not $SkipNgrok) {
    if (-not $NgrokConfigFile -or -not (Test-Path $NgrokConfigFile)) {
        throw "NgrokConfigFile not found. Set NgrokConfigFile to a valid config path in config.ps1."
    }

    $resolvedConfig = (Resolve-Path $NgrokConfigFile).Path
    $ngrokCommand = "`"$(Get-NgrokBinary)`" start --config `"$resolvedConfig`" --all"
    Start-ManagedProcess -Key 'ngrok' -CommandLine $ngrokCommand -WorkingDirectory $ProjectRoot
}
else {
    Write-Host 'Skipping ngrok (per parameter).' -ForegroundColor DarkGray
}

if (-not $SkipFrontend) {
    $frontendPath = Join-Path $ProjectRoot $FrontendScript
    if (-not (Test-Path $frontendPath)) {
        Write-Host "Frontend path not found at $frontendPath. Skipping." -ForegroundColor Yellow
    }
    else {
        $npmBinary = Get-Command npm -ErrorAction SilentlyContinue
        if (-not $npmBinary) {
            Write-Host "npm not found. Skipping frontend." -ForegroundColor Yellow
        }
        else {
            $frontendCommand = "cd /d `"$frontendPath`" && npm start"
            Start-ManagedProcess -Key 'frontend' -CommandLine $frontendCommand -WorkingDirectory $frontendPath
        }
    }
}
else {
    Write-Host 'Skipping frontend dev server (per parameter).' -ForegroundColor DarkGray
}

Write-Host 'Notebook server services started.' -ForegroundColor Cyan
