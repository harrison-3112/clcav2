$html = Get-Content -Path "ui/index.html" -Raw
$css = Get-Content -Path "ui/css/modules/mesdaily.css" -Raw

if ($html -notmatch 'href="css/modules/mesdaily.css"') {
    throw "index.html must load MES Daily module CSS"
}

if ($html -notmatch 'id="mes-bento-dashboard"') {
    throw "Missing Bento dashboard"
}

$bentoMatch = [regex]::Match($html, '<section id="mes-bento-dashboard"[\s\S]*?</section>\s*<!-- Tier 3')
if (-not $bentoMatch.Success) {
    throw "Unable to isolate Bento dashboard section"
}

$bento = $bentoMatch.Value
foreach ($legacyId in @('mes-r001-dashboard', 'mes-rty-preview-section', 'mes-defect-analytics-section')) {
    if ($bento -match "id=`"$legacyId`"") {
        throw "Legacy container $legacyId must not live inside Bento dashboard grid"
    }
}

foreach ($id in @('dashboard-kpi-yield', 'dashboard-kpi-output', 'dashboard-kpi-defects', 'dashboard-kpi-fpy', 'dashboard-yield-trend', 'dashboard-top-defects', 'dashboard-station-yield', 'dashboard-alerts-section')) {
    if ($html -notmatch "id=`"$id`"") {
        throw "Missing Bento target $id"
    }
}

if ($css -notmatch '#mes-panel:not\(\.hidden\)\s*\{[\s\S]*display:\s*flex;[\s\S]*gap:\s*1\.25rem;') {
    throw "MES panel must use flex column gap"
}

if ($css -notmatch '\.mes-time-input') {
    throw "Missing MES time/date width helper class"
}

Write-Output "PASS"
