[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
function Resolve-TeamRoot {
    $candidate = Get-Item -LiteralPath $PSScriptRoot
    while ($candidate) {
        if ((Test-Path (Join-Path $candidate.FullName 'apps\backend\pom.xml')) -and (Test-Path (Join-Path $candidate.FullName 'apps\web\package.json'))) { return $candidate.FullName }
        $candidate = $candidate.Parent
    }
    throw 'Could not locate FreshLink repository root.'
}
$root = Resolve-TeamRoot
$configPath = Join-Path $root 'runtime\config\team-private.json'
if (!(Test-Path $configPath)) { throw 'Run scripts/team/Setup-Team.ps1 first.' }
$config = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
Push-Location (Join-Path $root 'apps\web')
try {
    $env:VITE_PORT = [string]$config.frontendPort
    $env:VITE_GLOB_DOMAIN_URL = "http://127.0.0.1:$($config.backendPort)/jeecg-boot"
    $env:VITE_GLOB_API_URL = '/jeecgboot'
    $env:VITE_PROXY = ConvertTo-Json -Compress -InputObject @(
        @($env:VITE_GLOB_API_URL, $env:VITE_GLOB_DOMAIN_URL),
        @('/upload', 'http://localhost:3300/upload')
    )
    $env:VITE_USE_MOCK = 'false'
    & ([string]$config.nodePath) (Join-Path $root 'apps/web/node_modules/vite/bin/vite.js') --host 127.0.0.1 --port $config.frontendPort --strictPort
    if ($LASTEXITCODE -ne 0) { throw "Vite exited with code $LASTEXITCODE" }
} finally { Pop-Location }
