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

Los datos, imagenes, tours y hotspots se guardan en Supabase. Vercel solo publica el codigo de la pagina.

## Importante

La contrasena del tour protege la vista publica de un tour especifico. Para proteger el editor/admin online conviene usar login de Supabase o proteccion de Vercel.
