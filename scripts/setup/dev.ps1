#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Set-Location (Join-Path $PSScriptRoot '..\..')

if (-not (Test-Path '.env')) {
  Copy-Item '.env.example' '.env'
}

pnpm install
docker compose up -d
pnpm db:migrate
pnpm db:seed

Write-Host 'Waiting for API health is a separate step. Run pnpm dev after this script.'
