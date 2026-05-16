param(
  [Parameter(Mandatory = $true)]
  [string]$InputImage,

  [Parameter(Mandatory = $true)]
  [string]$OutputFolder,

  [Parameter(Mandatory = $true)]
  [string]$GeneratePy,

  [string]$Python = "python"
)

$ErrorActionPreference = "Stop"

$inputPath = Resolve-Path -LiteralPath $InputImage
$generatePath = Resolve-Path -LiteralPath $GeneratePy
$outputPath = New-Item -ItemType Directory -Force -Path $OutputFolder

Write-Host "Generando tiles Pannellum..."
Write-Host "Imagen: $inputPath"
Write-Host "Salida: $($outputPath.FullName)"

& $Python $generatePath -o $outputPath.FullName $inputPath

if ($LASTEXITCODE -ne 0) {
  throw "generate.py terminó con código $LASTEXITCODE"
}

Write-Host "Tiles generados. Sube la carpeta a tu ruta pública y usa Leer config.json en el editor."
