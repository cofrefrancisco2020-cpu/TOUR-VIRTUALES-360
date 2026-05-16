# Flujo multiresolution / tiles para Pannellum

La app sigue funcionando con panoramas normales, pero queda preparada para usar panoramas multiresolution cuando existan tiles generados.

## Idea del flujo

1. Subir una imagen equirectangular 360 normal, por ejemplo `edificio-curitiba.jpg`.
2. Guardar esa imagen original como respaldo de `Panorama normal`.
3. Generar tiles fuera del navegador con el generador multiresolution de Pannellum.
4. Subir la carpeta generada a una ruta pública, idealmente Cloudflare R2.
5. En el editor, abrir `Panorama avanzado`, elegir `Multiresolution / tiles`, poner la carpeta base y usar `Leer config.json`.
6. Si el `config.json` es válido, la escena queda asociada a esos tiles.
7. Si faltan tiles o algo falla, el visor mantiene el panorama normal como respaldo.

Ejemplo de estructura local:

```txt
pagina-web/
  panoramas-originales/
    edificio-curitiba.jpg
  tiles/
    edificio-curitiba/
      config.json
      fallback/
      1/
      2/
      3/
      4/
```

## Dependencias locales

El generador oficial de Pannellum vive en `utils/multires/generate.py` del repositorio de Pannellum. En este proyecto guardamos una copia local en:

```txt
tools/pannellum-generate.py
```

Requiere:

- Python 3
- Pillow
- NumPy
- Hugin, especialmente el binario `nona`

Instalación orientativa:

```powershell
python -m pip install Pillow numpy
```

Luego instala Hugin desde su instalador oficial y confirma que `nona` funciona. Si no está en PATH, usa la ruta directa:

```powershell
& "C:\Program Files\Hugin\bin\nona.exe" --help
```

## Generar tiles

Para una sola imagen:

```powershell
powershell -ExecutionPolicy Bypass -File ".\tools\generate-tiles.ps1" `
  -InputImage ".\panoramas-originales\edificio-curitiba.jpg" `
  -OutputFolder ".\tiles\edificio-curitiba" `
  -GeneratePy ".\tools\pannellum-generate.py"
```

Para procesar muchas imágenes de una vez, deja tus panoramas originales en:

```txt
panoramas-originales/
```

Luego ejecuta:

```powershell
powershell -ExecutionPolicy Bypass -File ".\tools\generate-tiles-batch.ps1" -Force
```

Ese script crea las carpetas en `tiles/` y deja un reporte con las rutas locales en:

```txt
tiles/_rutas-multires.txt
```

## Subir tiles a Cloudflare R2 desde el editor

El flujo mas comodo para trabajar online en Vercel es:

1. Genera los tiles en tu PC con `generate-tiles.ps1` o `generate-tiles-batch.ps1`.
2. Abre el editor online y selecciona la escena correspondiente.
3. En `Panorama avanzado`, pulsa `Subir carpeta de tiles`.
4. Selecciona la carpeta final de esa escena, por ejemplo `street-view`, que debe contener `config.json`.
5. El navegador sube todos los archivos de esa carpeta a Cloudflare R2 usando `/api/r2-presign`.
6. La app lee el `config.json`, completa la configuracion multires y guarda en Supabase solo la URL base y los datos tecnicos.

Los archivos pesados quedan en Cloudflare R2. Vercel solo firma las subidas y Supabase solo guarda la metadata del tour.

## Subir tiles a Cloudflare R2 con script

Los tiles son muchos archivos y no conviene guardarlos en Vercel/GitHub cuando el tour crece. El flujo recomendado es:

1. Generar tiles localmente.
2. Subir la carpeta generada a Cloudflare R2.
3. Guardar en Supabase solo la URL base y la configuración multires de la escena.

Con las variables R2 configuradas en `.env.local`, puedes subir todos los tiles con:

```powershell
node ".\tools\upload-tiles-r2.cjs" --folder ".\tiles" --prefix tiles
```

O subir solo una escena:

```powershell
node ".\tools\upload-tiles-r2.cjs" --folder ".\tiles" --prefix tiles --only curitiba-prueba
```

El script deja un reporte con las URL públicas en:

```txt
tiles/_rutas-r2-multires.txt
```

Ejemplo de URL base para pegar en el editor:

```txt
https://pub-fa4ecbd64b1048889618d3e7ed1a9c0b.r2.dev/tiles/curitiba-prueba
```

## Configuración esperada en la app

La app espera una configuración compatible con Pannellum:

```js
{
  type: "multires",
  multiRes: {
    basePath: "https://pub-fa4ecbd64b1048889618d3e7ed1a9c0b.r2.dev/tiles/edificio-curitiba",
    path: "/%l/%s%y_%x",
    fallbackPath: "/fallback/%s",
    extension: "jpg",
    tileResolution: 512,
    maxLevel: 4,
    cubeResolution: 4096
  }
}
```

Si `config.json` existe en la carpeta base, el botón `Leer config.json` intenta completar esos campos automáticamente.

## Producción

Vercel no debe generar tiles pesados durante la navegación normal. Para automatizarlo completamente en producción hay que crear un proceso separado:

1. El editor sube el panorama original a Cloudflare R2.
2. Un worker/backend recibe una tarea de generación.
3. Ese proceso descarga el panorama, ejecuta `generate.py`, sube los tiles a R2 y guarda `multiRes` en Supabase.
4. La app activa `panoramaMode = "multires"` solo cuando la carpeta de tiles está completa.

Mientras ese backend no exista, el flujo recomendado es generar localmente por lote, subir a R2 con el script y usar `Leer config.json` en el editor.
