$html = Get-Content -Path "ui/index.html" -Raw
$mes = Get-Content -Path "ui/js/modules/mesdaily.js" -Raw
$dash = Get-Content -Path "ui/js/modules/defectDashboard.js" -Raw

if ($html -notmatch 'id="mes-bento-empty"') {
    throw "Missing Bento empty state"
}

if ($mes -notmatch "setMesBentoDashboardState") {
    throw "Missing Bento dashboard state helper"
}

foreach ($state in @("'idle'", "'loading'", "'ready'", "'error'")) {
    if ($mes -notmatch [regex]::Escape($state)) {
        throw "Missing dashboard state $state"
    }
}

if ($dash -notmatch "No dashboard data") {
    throw "Overview renderer should write an honest no-data message"
}

Write-Output "PASS"
