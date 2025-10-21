param(
    [string]$TaskName = 'AltClinic-Notebook-Server',
    [switch]$Remove,
    [switch]$RunAfterRegister
)

$ErrorActionPreference = 'Stop'

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$startScript = Join-Path $scriptRoot 'start-services.ps1'
$configPath = Join-Path $scriptRoot 'config.ps1'
if (-not (Test-Path $startScript)) {
    throw "start-services.ps1 não encontrado em $scriptRoot"
}

Import-Module ScheduledTasks -ErrorAction Stop

$workingDirectory = Split-Path -Parent $scriptRoot
if (Test-Path $configPath) {
    . $configPath
    if ($ProjectRoot -and (Test-Path $ProjectRoot)) {
        $workingDirectory = $ProjectRoot
    }
}

if ($Remove) {
    try {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction Stop
        Write-Host "Tarefa $TaskName removida." -ForegroundColor Cyan
    }
    catch {
    Write-Host "Falha ao remover tarefa ${TaskName}: $($_.Exception.Message)" -ForegroundColor Red
    }

    return
}

$arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$startScript`""
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $arguments -WorkingDirectory $workingDirectory
$trigger = New-ScheduledTaskTrigger -AtLogOn

try {
    Register-ScheduledTask -TaskName $TaskName -Trigger $trigger -Action $action -Description 'Inicia backend AltClinic, relay e ngrok no logon.' -User $env:USERNAME -RunLevel Highest -Force | Out-Null
    Write-Host "Tarefa $TaskName registrada." -ForegroundColor Green
}
catch {
    throw "Não foi possível registrar a tarefa ${TaskName}: $($_.Exception.Message)"
}

if ($RunAfterRegister) {
    Start-ScheduledTask -TaskName $TaskName | Out-Null
    Write-Host "Tarefa $TaskName executada." -ForegroundColor Green
}
