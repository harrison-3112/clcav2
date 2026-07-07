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

function Get-TextBetween {
    param([string]$Source, [string]$StartText, [string]$EndText, [string]$RegionName)

    $start = $Source.IndexOf($StartText)
    if ($start -lt 0) {
        throw "Missing required region start: $RegionName"
    }

    $end = $Source.IndexOf($EndText, $start + $StartText.Length)
    if ($end -lt 0) {
        throw "Missing required region end: $RegionName"
    }

    return $Source.Substring($start, $end - $start)
}

function Get-JsFunctionBody {
    param([string]$Source, [string]$FunctionName)

    $pattern = "function\s+$([regex]::Escape($FunctionName))\s*\([^)]*\)\s*\{"
    $match = [regex]::Match($Source, $pattern)
    if (-not $match.Success) {
        throw "Missing required function: $FunctionName"
    }

    $openBraceIndex = $match.Index + $match.Length - 1
    $depth = 0
    for ($i = $openBraceIndex; $i -lt $Source.Length; $i++) {
        if ($Source[$i] -eq '{') {
            $depth++
        } elseif ($Source[$i] -eq '}') {
            $depth--
            if ($depth -eq 0) {
                return $Source.Substring($openBraceIndex, $i - $openBraceIndex + 1)
            }
        }
    }

    throw "Could not read function body: $FunctionName"
}

$routes = Read-Text 'app/backend/server/routes.js'
$mesRoute = Read-Text 'app/backend/routes/mesdaily.routes.js'
$client = Read-Text 'app/backend/modules/mesdaily/mesCommandClient.js'
$aggregator = Read-Text 'app/backend/modules/mesdaily/mesDailyAggregator.js'
$adapter = Read-Text 'ui/js/modules/mesdailyApiData.js'
$mes = Read-Text 'ui/js/modules/mesdaily.js'
$dash = Read-Text 'ui/js/modules/defectDashboard.js'
$index = Read-Text 'ui/index.html'
$kpiCards = Get-TextBetween $index '<!-- KPIs (col-span-3) -->' '<!-- Analytics (col-span-9) -->' 'dashboard KPI card area'
$stationDashboards = Get-JsFunctionBody $dash '_renderStationDashboards'
$summaryTable = Get-JsFunctionBody $dash '_renderSummaryTable'

# Backend route/client contract.
Assert-True ($routes -match "mesdaily\.routes") 'Backend route registry must register mesdaily.routes.'
Assert-True ($mesRoute -match "\bpost\s*\(\s*['`"]/api/mesdaily/query['`"]") 'MES route must expose POST /api/mesdaily/query.'
Assert-True ($client -match 'postMesCommand') 'MES command client must expose postMesCommand.'
Assert-True ($aggregator -match 'buildMesCommandPayloads') 'Aggregator must build command payloads.'
Assert-True ($aggregator -match 'normalizeMesKeys') 'Aggregator must normalize MES keys.'
Assert-True ($aggregator -match 'normalizeMesKeys[\s\S]{0,1200}\.trim\s*\(') 'normalizeMesKeys must trim MES key names.'
Assert-True ($aggregator -match 'VNPTH09DT') 'Aggregator must call/use VNPTH09DT.'
Assert-True ($aggregator -match 'VNPTH09') 'Aggregator must call/use VNPTH09.'
Assert-True ($aggregator -match 'station') 'Aggregator must require station input.'

# Frontend query contract.
Assert-True ($adapter -match 'buildMesDailyApiRequest') 'Frontend adapter must build request payload.'
Assert-True ($adapter -match 'toMesCommandHour') 'Frontend adapter must convert time to YYYYMMDDHH.'
Assert-True ($mes -match '/api/mesdaily/query') 'MES search must call backend query route for real searches.'
Assert-True ($mes -match 'MOCK') 'MES search must keep MOCK offline path.'
Assert-True ($mes -match 'getSelectedStations') 'MES search must read station selection.'
Assert-True ($mes -match 'Select at least one station') 'MES search must block when no station is selected.'

# Dashboard rendering contract.
Assert-True ($index.IndexOf('id="station-panel"') -gt $index.IndexOf('id="mes-panel"')) 'station-panel should remain after mes-panel in DOM for existing code.'
Assert-True ($kpiCards -match 'INPUT[\s\S]*FPY[\s\S]*OUTPUT[\s\S]*FAIL') 'KPI labels must be ordered INPUT, FPY, OUTPUT, FAIL.'
Assert-True ($stationDashboards -match 'failTimeline') 'Station chart must use failTimeline from VNPTH09DT.'
Assert-True ($stationDashboards -notmatch "label:\s*['`"]Input['`"]") 'Station timeline chart must not render hourly Input bars.'
Assert-True ($stationDashboards -notmatch "label:\s*['`"]FPY \(%\)['`"]") 'Station timeline chart must not render hourly FPY line.'
Assert-True ($dash -match 'woBreakdown') 'Pareto data must preserve WO breakdown.'
Assert-True ($summaryTable -match '<td\s+class="[^"]*(text-textMain|text-textDark|text-white)[^"]*"[^>]*>\s*\$\{st\.output') 'OUTPUT_QTY should use neutral/white text classes.'

$summarySectionCount = ([regex]::Matches($index, 'dashboard-summary-table-section')).Count
Assert-True ($summarySectionCount -eq 1) 'There must be exactly one Summary Data section.'

# Fixture contract.
$fixtureSummary = Get-Content -LiteralPath (Join-Path $repoRoot 'scratch/fixtures/mesdaily/VNPTH09.json') -Raw | ConvertFrom-Json
$fixtureDetail = Get-Content -LiteralPath (Join-Path $repoRoot 'scratch/fixtures/mesdaily/VNPTH09DT.json') -Raw | ConvertFrom-Json
Assert-True ($fixtureSummary.Data.Count -gt 0) 'VNPTH09 fixture must contain Data rows.'
Assert-True ($fixtureDetail.Data.Count -gt 0) 'VNPTH09DT fixture must contain Data rows.'

Write-Host 'MES Daily API integration contract passed.'
