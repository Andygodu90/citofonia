param(
  [int]$ApiPort = 3000
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$ApiDir = Join-Path $Root "apps\api"
$LogDir = Join-Path $Root "work\logs"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Stop-ProjectProcessOnPort {
  param([int]$Port)

  $connections = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue

  foreach ($connection in $connections) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)"
    $commandLine = $process.CommandLine
    if (-not $commandLine) {
      $commandLine = ""
    }

    if ($commandLine.Contains($Root)) {
      Stop-Process -Id $connection.OwningProcess -Force
      Write-Host "Proceso anterior del proyecto detenido en puerto $Port."
    } else {
      throw "El puerto $Port esta ocupado por otro proceso. Cierra ese proceso o usa otro puerto."
    }
  }
}

$stdout = Join-Path $LogDir "web-admin.out.log"
$stderr = Join-Path $LogDir "web-admin.err.log"

Stop-ProjectProcessOnPort -Port $ApiPort
Remove-Item -Path $stdout, $stderr -Force -ErrorAction SilentlyContinue

Start-Process `
  -FilePath "npm.cmd" `
  -ArgumentList @("run", "dev", "--", "-H", "0.0.0.0", "-p", "$ApiPort") `
  -WorkingDirectory $ApiDir `
  -RedirectStandardOutput $stdout `
  -RedirectStandardError $stderr `
  -WindowStyle Hidden

Start-Sleep -Seconds 5

Write-Host "Web admin lista:"
Write-Host "http://localhost:$ApiPort/admin"
Write-Host ""
Write-Host "Logs:"
Write-Host $stdout
Write-Host $stderr
