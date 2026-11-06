-- LPFIN — Migration 0005
-- Preferências do usuário (cor de destaque do tema), uma linha por usuário.

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  accent_color text not null default '#0e6855'
    check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists user_settings_owner_all on public.user_settings;
create policy user_settings_owner_all on public.user_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at before update on public.user_settings
  for each row execute function public.set_updated_at();
