# Contexto Rapido

El contexto completo del proyecto esta en:

```txt
C:\Users\h\OneDrive\Escritorio\Perspective 360, pagina tour\CONTEXTO_PROYECTO.md
```

Leer ese archivo primero antes de continuar en otro chat.

Links locales:

- Editor: `http://127.0.0.1:4173`
- Tour publico Curitiba limpio: `http://127.0.0.1:4173/tours/edificiocuritiba`
- Tour publico Curitiba antiguo: `http://127.0.0.1:4173/?tour=edificiocuritiba`
- Iframe Curitiba: `http://127.0.0.1:4173/tours/edificiocuritiba?embed=1`

Estado inmediato:

1. El constructor ya no muestra el campo para pegar URL externa para panoramas normales.
2. En publico se ocultan loaders propios y loaders internos de Pannellum.
3. En publico el cambio de escena espera la imagen nueva hasta 20 segundos antes de limpiar el frame anterior.
4. Cambios copiados a `C:\Users\h\OneDrive\Escritorio\HTML Tour Virtual` cuando se indique en el cierre de tarea.

Nota Vercel/R2:

- Si aparece `No se pudo firmar R2`, probar `/api/r2-presign`.
- Si devuelve `404`, Vercel no desplego la funcion API.
- Vercel necesita las variables `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`.

Pulido 2026-05-16:

- Ruta publica limpia: `/tours/{slug}`.
- Compatibilidad antigua: `?tour={slug}`.
- Estilos visuales de hotspots diferenciados.
- `Avance suave` mas lento y fluido.
- Ortografia visible corregida.
- Multires preparado con boton `Leer config.json`.
- Docs: `docs/MULTIRES_TILES.md`.
- Wrapper local: `tools/generate-tiles.ps1`.
- CORS R2 probado OK para Vercel.

Multires/R2 2026-05-16:

- Generador oficial copiado en `tools/pannellum-generate.py`.
- Lote local listo en `tools/generate-tiles-batch.ps1`.
- Subida de tiles a Cloudflare R2 lista en `tools/upload-tiles-r2.cjs`.
- El editor permite `Subir carpeta de tiles` desde `Panorama avanzado`; selecciona una carpeta de escena con `config.json` y la sube a Cloudflare R2.
- La subida de tiles desde el editor se optimizo con firma por lotes y subidas paralelas; no modifica la calidad de los JPG generados.
- El panel avanzado incluye `Liberar panorama normal al activar tiles` y `Liberar panorama normal ahora` para borrar el panorama normal pesado cuando la escena ya funciona con multiresolution.
- Carpeta de entrada para originales: `pagina-web/panoramas-originales`.
- Carpeta local de salida: `pagina-web/tiles`.
- Prueba real subida a R2: `https://pub-fa4ecbd64b1048889618d3e7ed1a9c0b.r2.dev/tiles/curitiba-prueba`

Portada de entrada / intro - 2026-05-18:

- Se agrego un panel `Entrada del tour` en el editor.
- Permite activar una portada antes de entrar al link publico del tour.
- El panel solo tiene activar portada y subir imagen de portada.
- La imagen de portada se sube directa a Cloudflare R2; Supabase solo guarda la URL publica y la key en `intro_config`.
- En el link publico, si la portada esta activa y tiene imagen subida, el visor no inicia hasta que el cliente hace clic sobre la portada.
- Si el tour tiene contrasena, primero se pide la contrasena y despues aparece la portada.
- SQL pendiente/necesario en Supabase para guardar esta configuracion online: `sql/2026-05-18_add_tour_intro_config.sql`.

Capa de ubicaciones / puntos de interes - pendiente:

- Debe ser una opcion activable/desactivable por tour o por escena, no algo obligatorio.
- El usuario debe poder crear puntos de interes sobre el panorama, igual que crea hotspots, pero orientados a informacion visual: edificios, barrios, locales, areas, hitos, servicios, etc.
- Cada punto debe permitir editar: categoria, nombre principal, subtitulo opcional, color, estilo, linea/flecha, posicion yaw/pitch y visibilidad.
- En el viewer publico debe existir un boton flotante para mostrar/ocultar esta capa.
- Estetica deseada: inspirada en las etiquetas de edificios de 3DVista, con rotulos flotantes, categoria pequena, nombre fuerte y linea/pin hacia el punto; pero con identidad propia, mas limpia y premium, no copia exacta.
- Debe funcionar sobre panoramas claros y oscuros, con buena legibilidad.
- Esta capa es distinta a hotspots de navegacion: sirve para informacion contextual visual, aunque opcionalmente podria abrir una ficha si se hace clic.
