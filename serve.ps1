$ErrorActionPreference = 'Stop'
$root = 'C:/Users/chris/Desktop/3D Printing'
Set-Location $root

Write-Host 'Starting local server at http://localhost:5500'
Write-Host 'Press Ctrl+C to stop.'

Start-Process "http://localhost:5500"
python -m http.server 5500
