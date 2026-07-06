$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

function Read-Text($relativePath) {
    $path = Join-Path $repoRoot $relativePath
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing required file: $relativePath"
    }
    return Get-Content -LiteralPath $path -Raw
}

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw $Message }
}

$index = Read-Text 'ui/index.html'
$mes = Read-Text 'ui/js/modules/mesdaily.js'
$dash = Read-Text 'ui/js/modules/defectDashboard.js'
$state = Read-Text 'ui/js/core/state.js'
$globals = Read-Text 'ui/js/core/globals.js'
$main = Read-Text 'ui/js/main.js'
$routes = Read-Text 'app/backend/server/routes.js'
$serverConfig = Read-Text 'app/backend/server/config.js'
$rootServer = Read-Text 'server.js'
$modulesConfig = Read-Text 'app/backend/config/modules.json'

Assert-True ($index -match 'js/modules/mesdailyDemoData\.js') 'index.html must load mesdailyDemoData.js.'
Assert-True ($index.IndexOf('js/modules/mesdailyDemoData.js') -lt $index.IndexOf('js/modules/defectDashboard.js')) 'mesdailyDemoData.js must load before defectDashboard.js.'
Assert-True ($index -notmatch 'Network\s*&\s*MES API|settingsMesApiUrl|MES API URL|MES API 地址') 'Settings UI must not expose MES API settings.'

foreach ($bad in @('/api/mesdaily', '/api/generate/mesdaily', '/api/logs/download-zip', '/api/quicklog/mes-trace/open-log', 'fetchRetry(', 'fetch(')) {
    Assert-True ($mes -notmatch [regex]::Escape($bad)) "mesdaily.js must not contain backend call token: $bad"
}

Assert-True ($mes -match 'buildMesDailyDemoRows') 'mesdaily.js must use local demo rows.'
Assert-True ($mes -match 'buildMesDailyDemoDashboardData') 'mesdaily.js must use local dashboard data.'
Assert-True ($mes -match 'buildMesDailyDemoLogText') 'mesdaily.js must use local log preview text.'
Assert-True ($mes -match 'buildMesDailyDemoCsv') 'mesdaily.js must use local CSV export.'

Assert-True ($dash -notmatch '/api/mesdaily|fetch\(') 'defectDashboard.js must not fetch dashboard data.'
Assert-True ($dash -match 'function\s+renderDashboardOverviewFromData\s*\(') 'defectDashboard.js must expose renderDashboardOverviewFromData(data).'

Assert-True ($state -match "mesdaily:[\s\S]*uiOnly:\s*true") 'MODULES.mesdaily must be marked uiOnly.'
Assert-True ($state -notmatch "mesdaily:[\s\S]*endpoint:\s*['""]/api/generate/mesdaily['""]") 'MODULES.mesdaily must not point at backend endpoint.'

Assert-True ($globals -notmatch '/api/app/mesdaily-settings|settingsMesApiUrl|mesApiUnreachable') 'globals.js must not load or translate MES API settings.'
Assert-True ($main -notmatch 'mes-r001-dashboard') 'main.js must not manage legacy mes-r001-dashboard.'

Assert-True ($routes -notmatch 'createMesDailyRoutes|mesdaily\.routes|mesdaily-settings|getPublicMesDailySettings|saveMesDailySettings|/api/mesdaily|/api/generate/mesdaily') 'Backend route registry must not register MES Daily backend/settings routes.'
Assert-True ($serverConfig -notmatch 'MESDAILY_SETTINGS|MesDaily|mesdaily\.settings') 'Backend config must not load MES Daily settings.'
Assert-True ($rootServer -notmatch 'MESDAILY_SETTINGS|getPublicMesDailySettings|mesDailySettings') 'Root server.js must not import or log MES Daily settings.'
Assert-True ($modulesConfig -notmatch '/api/generate/mesdaily') 'Backend module config must not expose MES Daily generate endpoint.'

foreach ($deletedPath in @(
    'app/backend/routes/mesdaily.routes.js',
    'app/backend/modules/mesdaily/mesClient.js',
    'app/backend/modules/mesdaily/dashboardAggregator.js',
    'app/backend/modules/mes-daily/logic.js',
    'app/backend/config/mesdaily.settings.json'
)) {
    Assert-True (-not (Test-Path -LiteralPath (Join-Path $repoRoot $deletedPath))) "Backend MES Daily file must be removed: $deletedPath"
}

Write-Host 'MES Daily frontend-only contract passed.'