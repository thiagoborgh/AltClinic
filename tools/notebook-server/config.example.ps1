# Copy this file to config.ps1 and adjust the values to match your environment.
$ProjectRoot = "C:\Users\thiag\saee"
$NodeExecutable = $null
$NgrokExecutable = $null
$NgrokConfigFile = Join-Path $PSScriptRoot "ngrok.yml"
$RelayPort = 4900
$ApiPort = 3000
$LogsDirectory = Join-Path $ProjectRoot "logs\notebook-server"
$BackendEntrypoint = "src/app.js"
$EmailRelayScript = "tools/email-relay/email-relay-server.js"
