# Contexto Rapido

El contexto completo del proyecto esta en:

```txt
C:\Users\h\OneDrive\Escritorio\Perspective 360, página tour\CONTEXTO_PROYECTO.md
```

Leer ese archivo primero antes de continuar en otro chat.

Links locales:

- Editor: `http://127.0.0.1:4173`
- Tour publico Curitiba: `http://127.0.0.1:4173/?tour=edificiocuritiba`
- Iframe Curitiba: `http://127.0.0.1:4173/?tour=edificiocuritiba&embed=1`

Estado inmediato:

1. El constructor ya no muestra el campo para pegar URL externa.
2. En publico se ocultan loaders propios y loaders internos de Pannellum.
3. En publico el cambio de escena espera la imagen nueva hasta 20 segundos antes de limpiar el frame anterior.
4. Cambios copiados a `C:\Users\h\OneDrive\Escritorio\HTML Tour Virtual`.

Nota Vercel/R2:

- Si aparece `No se pudo firmar R2`, probar `/api/r2-presign`.
- Si devuelve `404`, Vercel no desplego la funcion API.
- Se agrego `package.json`, se reforzo `api/r2-presign.js` y se declaro la funcion en `vercel.json`.
- Vercel necesita las variables `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`.
