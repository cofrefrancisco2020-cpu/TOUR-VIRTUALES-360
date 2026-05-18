alter table public.tours
  add column if not exists intro_config jsonb default '{}'::jsonb;

comment on column public.tours.intro_config is
  'Configuracion de portada inicial del tour publico. Guarda enabled, coverUrl y coverR2Key; el archivo pesado vive en Cloudflare R2.';
