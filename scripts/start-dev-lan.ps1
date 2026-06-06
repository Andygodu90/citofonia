param(
  [int]$ApiPort = 3000,
  [int]$MobilePort = 8082
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$ApiDir = Join-Path $Root "apps\api"
$MobileDir = Join-Path $Root "apps\mobile"
$LogDir = Join-Path $Root "work\logs"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Get-LocalLanIp {
  $ip = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
      $_.IPAddress -notlike "127.*" -and
      $_.IPAddress -notlike "169.254.*" -and
      $_.PrefixOrigin -in @("Dhcp", "Manual")
    } |
    Sort-Object InterfaceMetric |
    Select-Object -First 1 -ExpandProperty IPAddress

  if (-not $ip) {
    throw "No se pudo detectar la IP local. Verifica que el computador este conectado a Wi-Fi o red local."
  }

  return $ip
}

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

function Start-LoggedProcess {
  param(
    [string]$Name,
    [string]$Command,
    [string]$WorkingDirectory,
    [string[]]$Arguments,
    [string]$LogName
  )

  $stdout = Join-Path $LogDir "$LogName.out.log"
  $stderr = Join-Path $LogDir "$LogName.err.log"

  Remove-Item -Path $stdout, $stderr -Force -ErrorAction SilentlyContinue

  Start-Process `
    -FilePath $Command `
    -ArgumentList $Arguments `
    -WorkingDirectory $WorkingDirectory `
    -RedirectStandardOutput $stdout `
    -RedirectStandardError $stderr `
    -WindowStyle Hidden

  Write-Host "$Name iniciando..."
}

$lanIp = Get-LocalLanIp

Stop-ProjectProcessOnPort -Port $ApiPort
Stop-ProjectProcessOnPort -Port $MobilePort

Start-LoggedProcess `
  -Name "API" `
  -Command "npm.cmd" `
  -WorkingDirectory $ApiDir `
  -Arguments @("run", "dev", "--", "-H", "0.0.0.0", "-p", "$ApiPort") `
  -LogName "api"

Start-LoggedProcess `
  -Name "App movil web" `
  -Command "npx.cmd" `
  -WorkingDirectory $MobileDir `
  -Arguments @("expo", "start", "--web", "--host", "lan", "--port", "$MobilePort", "--clear") `
  -LogName "mobile"

Start-Sleep -Seconds 8

Write-Host ""
Write-Host "URLs de prueba:"
Write-Host "Web admin local:       http://localhost:$ApiPort/admin"
Write-Host "Web admin red local:   http://$lanIp`:$ApiPort/admin"
Write-Host "App iPhone/computador: http://$lanIp`:$MobilePort/"
Write-Host "API local:             http://$lanIp`:$ApiPort/"
Write-Host ""
Write-Host "Logs:"
Write-Host "API:    $LogDir\api.out.log"
Write-Host "Mobile: $LogDir\mobile.out.log"
