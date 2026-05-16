param(
  [string]$InputFolder = ".\panoramas-originales",
  [string]$OutputRoot = ".\tiles",
  [string]$GeneratePy = ".\tools\pannellum-generate.py",
  [string]$Python = "python",
  [string]$Nona = "C:\Program Files\Hugin\bin\nona.exe",
  [int]$Quality = 88,
  [int]$ThumbnailSize = 512,
  [switch]$Force
)

$ErrorActionPreference = "Stop"

function Convert-ToSlug {
  param([string]$Text)

  $normalized = $Text.Normalize([Text.NormalizationForm]::FormD)
  $builder = New-Object Text.StringBuilder

  foreach ($char in $normalized.ToCharArray()) {
    $category = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($char)
    if ($category -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$builder.Append($char)
    }
  }

  $slug = $builder.ToString().Normalize([Text.NormalizationForm]::FormC).ToLowerInvariant()
  $slug = $slug -replace '[^a-z0-9]+', '-'
  $slug = $slug.Trim('-')

  if ([string]::IsNullOrWhiteSpace($slug)) {
    return "panorama-" + (Get-Date -Format "yyyyMMddHHmmss")
  }

  return $slug
}

function Get-ImageSize {
  param([string]$Path)

  Add-Type -AssemblyName System.Drawing
  $image = [System.Drawing.Image]::FromFile($Path)
  try {
    [PSCustomObject]@{
      Width = $image.Width
      Height = $image.Height
      Ratio = $image.Width / $image.Height
    }
  } finally {
    $image.Dispose()
  }
}

$inputPath = Resolve-Path -LiteralPath $InputFolder
$generatePath = Resolve-Path -LiteralPath $GeneratePy
$outputRootPath = New-Item -ItemType Directory -Force -Path $OutputRoot
$reportPath = Join-Path $outputRootPath.FullName "_rutas-multires.txt"

if (-not (Test-Path -LiteralPath $Nona)) {
  throw "No se encontro nona.exe en '$Nona'. Revisa la ruta de Hugin."
}

$files = Get-ChildItem -LiteralPath $inputPath -File |
  Where-Object { $_.Extension -match '^\.(jpg|jpeg|png|webp|tif|tiff)$' } |
  Sort-Object Name

if (-not $files) {
  throw "No hay imagenes en '$($inputPath.Path)'."
}

$routes = New-Object System.Collections.Generic.List[string]
$routes.Add("# Rutas multires generadas")
$routes.Add("# Pega cada ruta en Panorama avanzado > Carpeta o ruta base de tiles")
$routes.Add("")

foreach ($file in $files) {
  $slug = Convert-ToSlug ([IO.Path]::GetFileNameWithoutExtension($file.Name))
  $sceneOutput = Join-Path $outputRootPath.FullName $slug
  $publicRoute = "/tiles/$slug"

  $size = Get-ImageSize $file.FullName
  $ratioOk = [Math]::Abs($size.Ratio - 2) -lt 0.03

  if (-not $ratioOk) {
    Write-Warning "Saltando '$($file.Name)': no parece equirectangular 2:1 ($($size.Width)x$($size.Height))."
    $routes.Add("SALTADA - $($file.Name): no es 2:1 ($($size.Width)x$($size.Height))")
    continue
  }

  if ((Test-Path -LiteralPath $sceneOutput) -and -not $Force) {
    Write-Host "Ya existe '$sceneOutput'. Usa -Force para regenerar."
    $routes.Add("$($file.BaseName): $publicRoute (ya existia)")
    continue
  }

  if ((Test-Path -LiteralPath $sceneOutput) -and $Force) {
    Remove-Item -LiteralPath $sceneOutput -Recurse -Force
  }

  Write-Host ""
  Write-Host "Generando tiles: $($file.Name)"
  Write-Host "Salida: $sceneOutput"

  & $Python $generatePath `
    -o $sceneOutput `
    -q $Quality `
    --thumbnailsize $ThumbnailSize `
    -n $Nona `
    $file.FullName

  if ($LASTEXITCODE -ne 0) {
    throw "generate.py fallo con '$($file.Name)' (codigo $LASTEXITCODE)."
  }

  if (-not (Test-Path -LiteralPath (Join-Path $sceneOutput "config.json"))) {
    throw "No se genero config.json para '$($file.Name)'."
  }

  $routes.Add("$($file.BaseName): $publicRoute")
}

$routes | Set-Content -Path $reportPath -Encoding UTF8

Write-Host ""
Write-Host "Listo. Rutas guardadas en:"
Write-Host $reportPath
Write-Host ""
Get-Content -Path $reportPath
