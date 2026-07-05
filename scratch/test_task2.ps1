$html = Get-Content -Path "ui/index.html" -Raw
if ($html -notmatch 'id="mes-bento-dashboard"') { throw "Missing bento dashboard in index.html" }
Write-Output "PASS"
