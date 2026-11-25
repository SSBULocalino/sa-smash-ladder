-- Ejecutar DESPUÉS de tu esquema original.
-- 1) Columnas extra necesarias para RPS, Bo3 y reportes
alter table matches
  add column if not exists rps_p1 text,
  add column if not exists rps_p2 text,
  add column if not exists game_no int not null default 1,
  add column if not exists first_banner_id uuid,
  add column if not exists game_winner_id uuid,
  add column if not exists report_p1 uuid,
  add column if not exists report_p2 uuid;

-- 2) RLS: lectura pública de perfiles/cola; matches solo para participantes.
alter table profiles enable row level security;
alter table matchmaking_queue enable row level security;
alter table matches enable row level security;

create policy "profiles read" on profiles for select using (true);
create policy "profiles insert own" on profiles for insert with check (auth.uid() = id);
create policy "profiles update own" on profiles for update using (auth.uid() = id);
create policy "queue read" on matchmaking_queue for select using (true);
create policy "matches read participants" on matches for select
  using (auth.uid() = player1_id or auth.uid() = player2_id);

-- 3) Un usuario NO puede tocar elo/wins/losses desde el cliente
revoke insert, update on profiles from authenticated, anon;
grant insert (id, discord_username, smash_tag, country, has_lan, accept_cross_region) on profiles to authenticated;
grant update (discord_username, smash_tag, country, has_lan, accept_cross_region) on profiles to authenticated;
-- Cola y matches se escriben solo desde Server Actions con service_role.
