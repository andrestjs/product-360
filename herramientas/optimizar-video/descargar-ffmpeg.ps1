# Descarga ffmpeg portatil (build essentials) y lo deja en la carpeta indicada.
# Se ejecuta solo la primera vez, desde optimizar-video-*.bat.
param(
    [Parameter(Mandatory = $true)]
    [string]$Destino
)

$ErrorActionPreference = 'Stop'
$uri = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip'
$zip = Join-Path $env:TEMP 'ffmpeg-portable.zip'
$dir = Join-Path $env:TEMP 'ffmpeg-extract'

$ProgressPreference = 'SilentlyContinue'

Write-Host "  Descargando ffmpeg (~90 MB)..."
Invoke-WebRequest -Uri $uri -OutFile $zip

if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
Expand-Archive -Path $zip -DestinationPath $dir -Force

$src = Get-ChildItem $dir -Directory | Select-Object -First 1
New-Item -ItemType Directory -Force -Path $Destino | Out-Null
Copy-Item (Join-Path $src.FullName '*') -Destination $Destino -Recurse -Force

Remove-Item $zip -Force
Remove-Item $dir -Recurse -Force

Write-Host "  ffmpeg listo en: $Destino"
