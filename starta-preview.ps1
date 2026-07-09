$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$siteRoot = Join-Path $projectRoot "hemsida"
$python = Join-Path $env:LOCALAPPDATA "Python\bin\python.exe"
$port = 4173

if (-not (Test-Path $python)) {
  $python = (Get-Command py).Source
  $arguments = "-m http.server $port --bind 127.0.0.1 --directory `"$siteRoot`""
} else {
  $arguments = "-m http.server $port --bind 127.0.0.1 --directory `"$siteRoot`""
}

$existing = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique

foreach ($processId in $existing) {
  if ($processId -and $processId -ne 0) {
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  }
}

Start-Process -FilePath $python -ArgumentList $arguments -WindowStyle Hidden
Start-Sleep -Seconds 2

$response = Invoke-WebRequest -Uri "http://127.0.0.1:$port/" -UseBasicParsing
Write-Host "Preview körs: http://127.0.0.1:$port/ ($($response.StatusCode))"
