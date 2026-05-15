# Contexto del Proyecto - Perspective360 / Nadir Tours

Este archivo es el punto de partida para retomar el proyecto en otro chat. Leerlo primero antes de hacer cambios.

## Rutas

- Proyecto local: `C:\Users\h\OneDrive\Escritorio\Perspective 360, página tour`
- App web: `C:\Users\h\OneDrive\Escritorio\Perspective 360, página tour\pagina-web`
- Carpeta exportable: `C:\Users\h\OneDrive\Escritorio\HTML Tour Virtual`

## Links locales

- Editor: `http://127.0.0.1:4173`
- Tour publico Curitiba: `http://127.0.0.1:4173/?tour=edificiocuritiba`
- Iframe Curitiba: `http://127.0.0.1:4173/?tour=edificiocuritiba&embed=1`

## Stack

- HTML, CSS y JavaScript estatico.
- Pannellum como visor 360.
- Supabase para login, base de datos y metadata.
- Cloudflare R2 para panoramas y miniaturas pesadas.
- Vercel pensado para deploy despues.

## Archivos principales

- `pagina-web/index.html`: estructura del editor y vista publica.
- `pagina-web/styles.css`: estilos, mobile, hotspots y transiciones.
- `pagina-web/app.js`: logica del editor, viewer, Supabase, R2, hotspots.
- `pagina-web/config.js`: configuracion publica de Supabase.
- `pagina-web/.server.cjs`: servidor local en `127.0.0.1:4173`.
- `pagina-web/r2-presign.cjs`: firma segura de uploads a R2.
- `pagina-web/api/r2-presign.js`: endpoint para Vercel.
- `pagina-web/.env.local`: variables locales de R2. Contiene secretos, no publicar.
- `pagina-web/.env.local.example`: plantilla sin secretos.
- `pagina-web/vercel.json`: configuracion basica de Vercel.
- `pagina-web/README_SUBIR.md`: instrucciones de deploy.

## Supabase

- Proyecto Supabase: `Perspective360`
- URL: `https://hpcpftchrxykrwjqzkai.supabase.co`
- La anon key esta en `pagina-web/config.js`.

Supabase debe guardar datos, no archivos pesados.

SQL ya ejecutado en tabla `scenes`:

```sql
alter table scenes
add column if not exists thumbnail_url text,
add column if not exists panorama_mode text default 'equirectangular',
add column if not exists multires jsonb,
add column if not exists r2_key text,
add column if not exists r2_thumbnail_key text,
add column if not exists asset_source text default 'supabase';
```

Campos nuevos esperados:

- `thumbnail_url`
- `panorama_mode`
- `multires`
- `r2_key`
- `r2_thumbnail_key`
- `asset_source`

## Cloudflare R2

- Bucket: `perspective360-panoramas`
- Public URL: `https://pub-fa4ecbd64b1048889618d3e7ed1a9c0b.r2.dev`
- Account ID: `a2ed2acdcc659a8cb1a417454beac238`
- Variables locales en `pagina-web/.env.local`.

Variables necesarias:

```txt
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET
R2_PUBLIC_BASE_URL
```

Importante: las llaves de R2 aparecieron en una captura durante la conversacion. Sirven para pruebas, pero para produccion final conviene rotarlas y crear nuevas.

Endpoint seguro local:

```txt
http://127.0.0.1:4173/api/r2-presign
```

Endpoint seguro en Vercel:

```txt
https://tour-virtuales-360.vercel.app/api/r2-presign
```

Si este endpoint responde `404`, Vercel no desplego la funcion serverless `api/r2-presign.js`.
Solucion aplicada en local:

- `pagina-web/api/r2-presign.js` ahora es autocontenido para Vercel.
- `pagina-web/package.json` marca el proyecto como Node.
- `pagina-web/vercel.json` declara la funcion `api/r2-presign.js`.

En Vercel deben existir estas Environment Variables:

```txt
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET
R2_PUBLIC_BASE_URL
```

Despues de agregarlas o cambiarlas, hacer redeploy.

Estado probado:

- `/api/r2-presign` responde `200`.
- Se probo subir archivo pequeno a R2 con PUT firmado: OK.
- Se probo leer por URL publica `r2.dev`: OK.
- Se limpio la basura de prueba `healthcheck`.
- En R2 existe una imagen real del tour:
  - `.../1778869630710-frontis-2.webp`
  - `.../1778869630710-frontis-2-thumb.webp`
- En Supabase la escena `VISTA CALLE` quedo con:
  - `asset_source = cloudflare`
  - `image_url = r2.dev`
  - `thumbnail_url = r2.dev`
  - `r2_key` y `r2_thumbnail_key` rellenos.

Escenas antiguas como `FRONTIS`, `LOBBY`, `PASILLO GYM`, `BALCON DEPARTAMENTO` siguen en Supabase Storage porque fueron subidas antes del cambio. Para moverlas a Cloudflare hay que volver a subirlas o hacer migracion.

## Hotspots

Estado actual:

- Los hotspots son visibles.
- Se pueden mover/arrastrar en editor.
- En link publico no se pueden editar ni mover.
- El link publico solo permite interactuar y navegar.
- `?tour=...` entra como vista publica directa, sin mostrar editor.
- Hover de hotspots de navegacion muestra texto tipo `Ir a ...`.
- Hotspots de navegacion pueden mostrar preview dentro del circulo.
- Si no existe `thumbnailUrl`, usan `scene.image` como respaldo.
- Preview se amplio para estilos: `pin`, `pulse`, `beacon`, `ring`, `square`, `glass`, `arrow`, `chevron`.

## Calidad de panoramas

Se subio la calidad porque Cloudflare R2 ya absorbe los archivos pesados.

Configuracion actual en `createPanoramaAssets`:

- Panoramas equirectangulares anchos: `maxWidth 8192`, `quality 0.92`
- Otros panoramas: `maxWidth 5200`, `quality 0.92`
- Miniatura: `maxWidth 1024`, `quality 0.78`

Nota: imagenes ya subidas con compresion anterior deben volver a subirse para verse mejor.

## Multires / Tiles

La estructura esta preparada, pero todavia no hay generador de tiles.

Campos:

- `panoramaMode`
- `multiRes`

Editor tiene panel avanzado `Panorama avanzado`.

Si no hay tiles, usa panorama normal equirectangular.

Falta futuro:

- Generar tiles reales tipo Google Street View / 3DVista.
- Conectar esos tiles con Pannellum multires.

## Cambio reciente - loaders publicos

El usuario no quiere pantallas de carga entre escenas.

Estado actual:

- En vista publica `showViewerLoading` se bloquea y oculta el loader propio.
- En vista publica se ocultan loaders internos de Pannellum:
  - `.pnlm-load-box`
  - `.pnlm-lbar`
  - `.pnlm-lbar-fill`
  - `.pnlm-lmsg`
  - `.pnlm-loading`
- En vista publica el cambio de escena espera hasta 20 segundos a que cargue el panorama objetivo antes de limpiar el frame anterior.
- En editor se mantiene el loader para que el usuario sepa que esta cargando.

Objetivo de experiencia:

- Mantener el ultimo frame/zoom de avance al hotspot hasta que la nueva escena este lista.
- No mostrar caja `Loading...`.
- No mostrar pantalla intermedia ni fondo cuadriculado.
- Ocultar loaders en vista publica.

Si vuelve a aparecer un loader, inspeccionar el DOM porque Pannellum podria estar usando otra clase interna, por ejemplo `.pnlm-lbox`.

## Cambio reciente - UI escenas

Se quito del constructor el campo visible para pegar URL externa.
Tambien se eliminaron referencias JS/CSS de `externalSceneUrl`, `addExternalSceneBtn`, `.external-scene-form` y la funcion `addExternalSceneFromUrl`.

Hint actual de escenas:

```txt
Sube panoramas 360 equirectangulares. El editor optimiza y envia los archivos pesados a Cloudflare R2.
```

## 404 Not Found

Si aparece `404 Not Found`, significa que el servidor local pidio una ruta o archivo que no existe. No significa necesariamente que Supabase o R2 esten malos.

Puede pasar si el navegador abre una ruta estatica que `.server.cjs` no sabe resolver.

## Flujo de trabajo

1. Trabajar primero en local.
2. Probar en `http://127.0.0.1:4173`.
3. Validar sintaxis:

```powershell
node --check pagina-web\app.js
node --check pagina-web\r2-presign.cjs
node --check pagina-web\api\r2-presign.js
```

4. Si se toca servidor, reiniciar proceso en puerto `4173`.
5. Copiar cambios a:

```txt
C:\Users\h\OneDrive\Escritorio\HTML Tour Virtual
```

6. Recien despues pensar en GitHub/Vercel.

## Reglas del usuario

- No redisenar toda la pagina.
- No cambiar identidad visual.
- No eliminar funcionalidades existentes.
- No romper Supabase.
- No cambiar Pannellum.
- Mantener flujo simple.
- Todo lo pesado debe ir a Cloudflare R2.
- Supabase debe quedar para base de datos y metadata.
- El link publico no debe editar nada.
- Mobile debe verse full screen en tour publico.

## Proxima accion recomendada

1. Quitar campo de URL externa del constructor.
2. Ocultar loaders de Pannellum y loader propio en vista publica.
3. Ajustar transicion para mantener ultimo frame hasta que la escena nueva este lista.
4. Probar `http://127.0.0.1:4173/?tour=edificiocuritiba`.
5. Copiar a `HTML Tour Virtual`.
