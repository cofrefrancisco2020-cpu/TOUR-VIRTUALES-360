# HTML Tour Virtual

Proyecto web estatico para crear y publicar tours virtuales 360.

## Archivos principales

- `index.html`: estructura de la app.
- `styles.css`: diseno, mobile y hotspots.
- `app.js`: logica del editor, vista publica y hotspots.
- `config.js`: conexion a Supabase.
- `vercel.json`: configuracion simple para publicar en Vercel.

## Como probar local

Abrir:

```txt
http://127.0.0.1:4173
```

Vista publica:

```txt
http://127.0.0.1:4173/?tour=casa-piloto-demo&preview=1
```

Iframe:

```txt
http://127.0.0.1:4173/?tour=casa-piloto-demo&embed=1
```

## Publicar

1. Subir esta carpeta a GitHub.
2. Conectar el repositorio en Vercel.
3. Vercel publicara la app como sitio estatico.

Los datos, tours y hotspots se guardan en Supabase. Los panoramas pesados pueden subirse automaticamente a Cloudflare R2 si las variables estan configuradas.

## Cloudflare R2 para panoramas

El editor intenta subir primero los panoramas y miniaturas a Cloudflare R2. Supabase queda solo para datos del tour.

Variables necesarias en Vercel:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`

Para probar local, copia `.env.local.example` como `.env.local` y rellena esos valores.

En el bucket R2, habilita CORS para permitir `PUT` desde:

- `http://127.0.0.1:4173`
- tu dominio de Vercel

Si R2 todavia no esta configurado, el editor usa Supabase Storage como respaldo temporal.

## Importante

La contrasena del tour protege la vista publica de un tour especifico. Para proteger el editor/admin online conviene usar login de Supabase o proteccion de Vercel.
