#Requires -Version 5.1
<#
.SYNOPSIS
  First-time setup for LocalSite Optimizer on Windows.
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $Root

function Require-Command([string]$Name, [string]$InstallHint) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing '$Name'. $InstallHint"
  }
}

Write-Host '==> LocalSite Optimizer - Windows install' -ForegroundColor Cyan
Write-Host "    Root: $Root"

Require-Command 'node' 'Install Node.js 22+ from https://nodejs.org/'
Require-Command 'docker' 'Install Docker Desktop from https://www.docker.com/products/docker-desktop/'

$nodeVersion = (node -p "process.versions.node.split('.')[0]")
if ([int]$nodeVersion -lt 22) {
  throw "Node.js 22+ required (found v$(node -v))"
}

if (-not (Get-Command 'pnpm' -ErrorAction SilentlyContinue)) {
  Write-Host '==> Enabling pnpm via corepack...'
  corepack enable
  corepack prepare pnpm@10.14.0 --activate
}
Require-Command 'pnpm' 'Run: corepack enable && corepack prepare pnpm@10.14.0 --activate'

if (-not (Test-Path '.env')) {
  Write-Host '==> Creating .env from .env.example'
  Copy-Item '.env.example' '.env'
}

Write-Host '==> Installing dependencies (may take a few minutes)...'
pnpm install

Write-Host '==> Installing Playwright Chromium for website crawls...'
pnpm --filter @lso/crawler exec playwright install chromium

Write-Host '==> Starting Postgres + Redis (Docker)...'
docker compose up -d postgres redis

Write-Host '==> Waiting for database...'
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
  $pg = docker compose exec -T postgres pg_isready -U lso -d lso 2>$null
  if ($LASTEXITCODE -eq 0) {
    $ready = $true
    break
  }
  Start-Sleep -Seconds 2
}
if (-not $ready) {
  throw 'Postgres did not become ready. Is Docker Desktop running?'
}

Write-Host '==> Running migrations + seed...'
pnpm db:migrate
pnpm db:seed

Write-Host ''
Write-Host 'Install complete.' -ForegroundColor Green
Write-Host 'Double-click "LocalSite Optimizer.bat" or run:'
Write-Host "  powershell -File `"$Root\scripts\windows\Start-LocalSiteOptimizer.ps1`""
