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

$routes = Read-Text 'app/backend/server/routes.js'
$mesRoute = Read-Text 'app/backend/routes/mesdaily.routes.js'
$client = Read-Text 'app/backend/modules/mesdaily/mesCommandClient.js'
$aggregator = Read-Text 'app/backend/modules/mesdaily/mesDailyAggregator.js'
$adapter = Read-Text 'ui/js/modules/mesdailyApiData.js'
$mes = Read-Text 'ui/js/modules/mesdaily.js'
$dash = Read-Text 'ui/js/modules/defectDashboard.js'
$index = Read-Text 'ui/index.html'

Assert-True ($routes -match "mesdaily\.routes") 'Backend route registry must register mesdaily.routes.'
Assert-True ($mesRoute -match "router\.post\('/api/mesdaily/query'") 'MES route must expose POST /api/mesdaily/query.'
Assert-True ($client -match 'postMesCommand') 'MES command client must expose postMesCommand.'
Assert-True ($aggregator -match 'buildMesCommandPayloads') 'Aggregator must build command payloads.'
Assert-True ($aggregator -match 'normalizeMesKeys') 'Aggregator must normalize MES keys with trim().'
Assert-True ($aggregator -match 'VNPTH09DT') 'Aggregator must call/use VNPTH09DT.'
Assert-True ($aggregator -match 'VNPTH09') 'Aggregator must call/use VNPTH09.'
Assert-True ($aggregator -match 'station') 'Aggregator must require station input.'
Assert-True ($adapter -match 'buildMesDailyApiRequest') 'Frontend adapter must build request payload.'
Assert-True ($adapter -match 'toMesCommandHour') 'Frontend adapter must convert time to YYYYMMDDHH.'
Assert-True ($mes -match '/api/mesdaily/query') 'MES search must call backend query route for real searches.'
Assert-True ($mes -match 'MOCK') 'MES search must keep MOCK offline path.'
Assert-True ($mes -match 'getSelectedStations') 'MES search must read station selection.'
Assert-True ($mes -match 'Select at least one station') 'MES search must block when no station is selected.'
Assert-True ($index.IndexOf('id="station-panel"') -gt $index.IndexOf('id="mes-panel"')) 'station-panel should remain after mes-panel in DOM for existing code.'
Assert-True ($index -match 'INPUT[\s\S]*FPY[\s\S]*OUTPUT[\s\S]*FAIL') 'KPI labels must be ordered INPUT, FPY, OUTPUT, FAIL.'
Assert-True ($dash -match 'failTimeline') 'Station chart must use failTimeline from VNPTH09DT.'
Assert-True ($dash -notmatch "label:\s*'Input'[\s\S]*station-combo") 'Station timeline chart must not render hourly Input bars.'
Assert-True ($dash -notmatch "label:\s*'FPY \(%\)'[\s\S]*station-combo") 'Station timeline chart must not render hourly FPY line.'
Assert-True ($dash -match 'woBreakdown') 'Pareto data must preserve WO breakdown.'
Assert-True ($dash -match 'text-textMain|text-textDark|text-white') 'OUTPUT_QTY should use neutral/white text classes.'

$summarySectionCount = ([regex]::Matches($index, 'dashboard-summary-table-section')).Count
Assert-True ($summarySectionCount -eq 1) 'There must be exactly one Summary Data section.'

$fixtureSummary = Get-Content -LiteralPath (Join-Path $repoRoot 'scratch/fixtures/mesdaily/VNPTH09.json') -Raw | ConvertFrom-Json
$fixtureDetail = Get-Content -LiteralPath (Join-Path $repoRoot 'scratch/fixtures/mesdaily/VNPTH09DT.json') -Raw | ConvertFrom-Json
Assert-True ($fixtureSummary.Data.Count -gt 0) 'VNPTH09 fixture must contain Data rows.'
Assert-True ($fixtureDetail.Data.Count -gt 0) 'VNPTH09DT fixture must contain Data rows.'

Write-Host 'MES Daily API integration contract passed.'
