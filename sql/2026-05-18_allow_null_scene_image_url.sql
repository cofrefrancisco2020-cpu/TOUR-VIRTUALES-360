-- Permite que una escena multiresolution no tenga panorama normal pesado.
-- Los tiles quedan en Cloudflare R2 y la miniatura queda separada en thumbnail_url.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'scenes'
      and column_name = 'image_url'
  ) then
    alter table public.scenes
      alter column image_url drop not null;
  end if;
end $$;

alter table public.scenes
  add column if not exists thumbnail_url text;

alter table public.scenes
  add column if not exists r2_thumbnail_key text;

comment on column public.scenes.image_url is
  'Opcional. Puede quedar null cuando la escena usa panorama multiresolution/tiles en Cloudflare R2.';

comment on column public.scenes.thumbnail_url is
  'Miniatura liviana para listados y previews; no reemplaza al panorama 360.';
