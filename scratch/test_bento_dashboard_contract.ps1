$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$defectPath = Join-Path $repoRoot 'ui/js/modules/defectDashboard.js'
$mesdailyPath = Join-Path $repoRoot 'ui/js/modules/mesdaily.js'

function Assert-True {
    param(
        [bool]$Condition,
        [string]$Message
    )
    if (-not $Condition) {
        throw $Message
    }
}

function Get-FunctionBody {
    param(
        [string]$Source,
        [string]$FunctionName
    )

    $match = [regex]::Match($Source, "function\s+$([regex]::Escape($FunctionName))\s*\([^)]*\)\s*\{")
    Assert-True $match.Success "Missing function $FunctionName."

    $start = $match.Index
    $brace = $Source.IndexOf('{', $match.Index)
    $depth = 0
    for ($i = $brace; $i -lt $Source.Length; $i++) {
        $char = $Source[$i]
        if ($char -eq '{') { $depth++ }
        if ($char -eq '}') { $depth-- }
        if ($depth -eq 0) {
            return $Source.Substring($start, $i - $start + 1)
        }
    }

    throw "Could not parse function body for $FunctionName."
}

$defect = Get-Content -Raw -Path $defectPath
$mesdaily = Get-Content -Raw -Path $mesdailyPath

$renderDefectBody = Get-FunctionBody -Source $defect -FunctionName 'renderDefectDashboard'
$searchBody = Get-FunctionBody -Source $mesdaily -FunctionName 'searchMesDashboard'

Assert-True ($renderDefectBody -notmatch 'Defect Analytics Dashboard') 'renderDefectDashboard must not inject the legacy Defect Analytics Dashboard card.'
Assert-True ($renderDefectBody -notmatch 'container\.innerHTML\s*=\s*html') 'renderDefectDashboard must not use the legacy container.innerHTML = html path.'

Assert-True ($defect -match 'function\s+renderDashboardOverviewFromData\s*\(\s*data\s*\)') 'Missing public renderDashboardOverviewFromData(data).'
$overviewBody = Get-FunctionBody -Source $defect -FunctionName 'renderDashboardOverviewFromData'
Assert-True ($overviewBody -match '_renderOverviewContent\s*\(\s*data\s*,\s*getDashboardAlertConfig\s*\(\s*\)\s*\)') 'renderDashboardOverviewFromData must reuse _renderOverviewContent(data, getDashboardAlertConfig()).'

Assert-True ($mesdaily -match 'function\s+buildMesR001MockDashboardData\s*\(\s*rows\s*\)') 'Missing buildMesR001MockDashboardData(rows) mock fixture builder.'
Assert-True ($searchBody -match 'renderDashboardOverviewFromData\s*\(\s*buildMesR001MockDashboardData\s*\(\s*mesR001Rows\s*\)\s*\)') 'MOCK branch must pass buildMesR001MockDashboardData(mesR001Rows) into renderDashboardOverviewFromData.'
Assert-True ($searchBody -match 'renderDashboardOverviewFromData\s*\(\s*data\s*\)') 'Real API success path must call renderDashboardOverviewFromData(data).'
Assert-True ($searchBody -notmatch 'renderDefectDashboard\s*\(\s*mesR001Rows\s*,\s*woList\s*\)') 'MES Daily search flow must not call renderDefectDashboard(mesR001Rows, woList) directly.'

Write-Host 'Bento dashboard contract passed.'
