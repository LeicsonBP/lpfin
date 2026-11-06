-- LPFIN — Migration 0007
-- Estilo visual dos cards por usuário: 'solid' (padrão) ou 'glass' (liquid glass).

alter table public.user_settings
  add column if not exists surface_style text not null default 'solid';

alter table public.user_settings
  drop constraint if exists user_settings_surface_style_check;

alter table public.user_settings
  add constraint user_settings_surface_style_check
  check (surface_style in ('solid', 'glass'));

-- faz o PostgREST enxergar a coluna nova sem esperar o cache expirar
-- (evita "Could not find the 'surface_style' column ... in the schema cache")
notify pgrst, 'reload schema';
