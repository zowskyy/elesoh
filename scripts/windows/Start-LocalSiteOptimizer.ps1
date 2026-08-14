#Requires -Version 5.1
<#
.SYNOPSIS
  Start LocalSite Optimizer - Docker infra, API, worker, web UI, open browser.
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $Root

$WebUrl = 'http://localhost:3000'
$ApiHealthUrl = 'http://localhost:3001/health/live'

function Test-ApiLive {
  try {
    $response = Invoke-WebRequest -Uri $ApiHealthUrl -UseBasicParsing -TimeoutSec 3
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

Write-Host '==> LocalSite Optimizer' -ForegroundColor Cyan

if (-not (Test-Path '.env')) {
  Write-Host 'No .env found - running install first...' -ForegroundColor Yellow
  & (Join-Path $PSScriptRoot 'Install-LocalSiteOptimizer.ps1')
}

if (-not (Test-Path 'node_modules')) {
  Write-Host 'Dependencies missing - run Install-LocalSiteOptimizer.ps1 first.' -ForegroundColor Red
  exit 1
}

if (-not (Get-Command 'docker' -ErrorAction SilentlyContinue)) {
  throw 'Docker not found. Start Docker Desktop or run Install-LocalSiteOptimizer.ps1'
}

Write-Host '==> Starting Postgres + Redis...'
docker compose up -d postgres redis

Write-Host '==> Waiting for Postgres...'
$pgReady = $false
for ($i = 0; $i -lt 45; $i++) {
  docker compose exec -T postgres pg_isready -U lso -d lso 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) {
    $pgReady = $true
    break
  }
  Start-Sleep -Seconds 2
}
if (-not $pgReady) {
  throw 'Postgres not ready. Open Docker Desktop and retry.'
}

Write-Host '==> Applying migrations...'
pnpm db:migrate 2>$null

if (Test-ApiLive) {
  Write-Host '==> API already running - opening app...'
  Start-Process $WebUrl
  Write-Host "App: $WebUrl"
  exit 0
}

Write-Host '==> Starting API + worker + web (new window)...'
$devScript = Join-Path $env:TEMP 'lso-dev-server.ps1'
@(
  "Set-Location '$Root'"
  '$host.UI.RawUI.WindowTitle = "LocalSite Optimizer - Server"'
  'Write-Host "LocalSite Optimizer server running. Close this window to stop." -ForegroundColor Green'
  'pnpm dev'
) | Set-Content -Path $devScript -Encoding Ascii

Start-Process powershell -ArgumentList '-NoExit', '-ExecutionPolicy', 'Bypass', '-File', $devScript

Write-Host '==> Waiting for API (up to 90s)...'
$live = $false
for ($i = 0; $i -lt 45; $i++) {
  if (Test-ApiLive) {
    $live = $true
    break
  }
  Start-Sleep -Seconds 2
  Write-Host "   ... starting ($($i * 2)s)"
}

if (-not $live) {
  Write-Host 'Server is still starting. Open manually when ready:' -ForegroundColor Yellow
  Write-Host "  $WebUrl"
  exit 0
}

Write-Host '==> Opening app in browser...' -ForegroundColor Green
Start-Process $WebUrl

Write-Host ''
Write-Host 'LocalSite Optimizer is running.' -ForegroundColor Green
Write-Host "  App:  $WebUrl"
Write-Host "  API:  http://localhost:3001/health"
Write-Host ''
Write-Host 'To stop: close the "LocalSite Optimizer - Server" PowerShell window.'
Write-Host 'Docker Postgres/Redis keep running (docker compose down to stop).'
