$js = Get-Content -Path "ui/js/modules/mesdaily.js" -Raw

if ($js -notmatch "mes-r001-toggle-details") { throw "Missing toggle button binding" }
if ($js -notmatch "mes-r001-table") { throw "Missing table target for detail toggle" }
if ($js -notmatch "hide-details") { throw "Missing hide-details toggle logic" }
if ($js -notmatch "detail-col") { throw "Missing detail column render class" }
if ($js -notmatch "font-mono") { throw "Missing monospace class for copyable detail columns" }
if ($js -notmatch "select-all") { throw "Missing select-all class for copyable detail columns" }
if ($js -notmatch "WorkOrder") { throw "Missing WO data render" }
if ($js -notmatch "DefectDesc") { throw "Missing description data render" }

Write-Output "PASS"
