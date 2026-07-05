$html = Get-Content -Path "ui/mesdaily-bento-mockup.html" -Raw -ErrorAction SilentlyContinue
if ($null -eq $html) { throw "File not found" }
if ($html -notmatch 'id="mes-panel"') { throw "Missing mes-panel" }
if ($html -notmatch 'id="mes-bento-dashboard"') { throw "Missing bento dashboard" }
Write-Output "PASS"
