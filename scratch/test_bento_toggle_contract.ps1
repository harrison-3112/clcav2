$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$modulePath = Join-Path $repoRoot 'ui/js/modules/mesdaily.js'

if (-not (Test-Path -LiteralPath $modulePath)) {
    throw "Missing MES Daily module at $modulePath"
}

$source = Get-Content -LiteralPath $modulePath -Raw

function Assert-True {
    param(
        [bool]$Condition,
        [string]$Message
    )

    if (-not $Condition) {
        throw $Message
    }
}

function Assert-Match {
    param(
        [string]$Text,
        [string]$Pattern,
        [string]$Message
    )

    Assert-True ([regex]::IsMatch($Text, $Pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)) $Message
}

$toggleMatches = [regex]::Matches($source, "\.classList\.toggle\(\s*['""]hide-details['""]\s*\)")
Assert-True ($toggleMatches.Count -eq 1) "Expected exactly one hide-details classList.toggle path; found $($toggleMatches.Count)."

Assert-True (-not $source.Contains('getMesR001ToggleIcon')) 'Found stale getMesR001ToggleIcon reference.'

$detailsToggleHelperCall = [regex]::IsMatch($source, '(?<!function\s)getMesR001DetailsToggleHtml\s*\(')
if ($detailsToggleHelperCall) {
    Assert-Match $source 'function\s+getMesR001DetailsToggleHtml\s*\(' 'getMesR001DetailsToggleHtml is called but not defined.'
}

Assert-True (-not $source.Contains('dataset.detailsToggleBound')) 'Unexpected dataset.detailsToggleBound guard found; static R001 binding should stay single-path.'

Assert-Match $source "function\s+getMesR001Columns\s*\(\)\s*\{\s*return\s*\[\s*['""]SN['""]\s*,\s*['""]Terminal['""]\s*,\s*['""]Result['""]\s*,\s*['""]DefectCode['""]\s*,\s*['""]WO['""]\s*,\s*['""]Description['""]\s*,\s*['""]Time['""]\s*\]" 'R001 columns must be SN, Terminal, Result, DefectCode, WO, Description, Time.'

Assert-Match $source 'SN:\s*row\?\.SN\s*\|\|\s*row\?\.SerialNumber' 'SN must preserve SN and SerialNumber aliases.'
Assert-Match $source 'Result:\s*row\?\.Result\s*\|\|\s*row\?\.Status' 'Result must preserve Result and Status aliases.'
Assert-Match $source 'WO:\s*row\?\.WO\s*\|\|\s*row\?\.WorkOrder' 'WO must preserve WO and WorkOrder aliases.'
Assert-Match $source 'Description:\s*row\?\.Description\s*\|\|\s*row\?\.DefectDesc' 'Description must preserve Description and DefectDesc aliases.'
Assert-Match $source 'Station:\s*row\?\.Station\s*\|\|\s*row\?\.Terminal' 'Station label must preserve Station and Terminal aliases.'
Assert-Match $source 'let\s+filtered\s*=\s*\(Array\.isArray\(rows\)\s*\?\s*rows\s*:\s*\[\]\)\.map\(\(row,\s*index\)\s*=>\s*\(\{\s*\.\.\.row,\s*_MesR001Index:\s*index\s*\}\)\)' 'Rows must preserve source index before filtering/search.'
Assert-True (-not ([regex]::IsMatch($source, 'return\s+filtered\.map\(\(row,\s*index\)\s*=>\s*\(\{\s*\.\.\.row,\s*_MesR001Index:\s*index\s*\}\)\)'))) 'Filtered rows must not be re-indexed after filtering/search.'

Assert-Match $source 'WO:\s*`<td\s+class="[^"]*\bdetail-col\b[^"]*\bfont-mono\b[^"]*\bselect-all\b[^"]*"' 'WO cell must include detail-col, font-mono, and select-all classes.'
Assert-Match $source 'Description:\s*`<td\s+class="[^"]*\bdetail-col\b[^"]*\bfont-mono\b[^"]*\bselect-all\b[^"]*"' 'Description cell must include detail-col, font-mono, and select-all classes.'

Write-Host 'MES Daily R001 bento toggle contract passed.'
