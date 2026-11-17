-- Perfiles de familia: un comensal guarda las alergias de otras personas
-- («Lucía», «Abuelo»…) para filtrar cartas, mapa y productos para todas.
--
-- Son DATOS DE SALUD de terceros (RGPD, art. 9):
-- - Solo los ve y edita el titular de la cuenta (RLS). Nunca restaurantes ni admin.
-- - Exigen el consentimiento del titular y su declaración de que es madre, padre
--   o tutor legal, o tiene el permiso de esa persona.
-- - Al retirar el consentimiento se borran también sus alergias; al borrar la
--   cuenta, todo (cascada).
--
-- Plan de la cuenta (decisión del usuario: función premium, el cobro llegará
-- más adelante): 'free' permite 1 familiar y 'premium' hasta 10. Solo el
-- servidor cambia el plan (el usuario no tiene permiso sobre esa columna).

create type public.account_plan as enum ('free', 'premium');

alter table public.profiles
  add column plan public.account_plan not null default 'free';

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  guardian_confirmed_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.family_members enable row level security;
create index family_members_user_id_idx on public.family_members (user_id);

create table public.family_member_allergens (
  member_id uuid not null references public.family_members (id) on delete cascade,
  allergen public.allergen not null,
  primary key (member_id, allergen)
);
alter table public.family_member_allergens enable row level security;

-- ---------------------------------------------------------------------------
-- Permisos y políticas (solo el titular)
-- ---------------------------------------------------------------------------
-- Supabase da permisos por defecto a anon y authenticated sobre las tablas
-- nuevas: se retiran todos y se conceden solo los necesarios.
revoke all on public.family_members, public.family_member_allergens from anon, authenticated;

create function private.owns_family_member(target_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.family_members m
    where m.id = target_member_id and m.user_id = (select auth.uid())
  );
$$;
revoke all on function private.owns_family_member(uuid) from public, anon;
grant execute on function private.owns_family_member(uuid) to authenticated;

-- Se crean solo con add_family_member (comprueba plan, consentimiento y la
-- declaración del tutor). Se pueden leer, renombrar y borrar los propios.
grant select, delete on public.family_members to authenticated;
grant update (name) on public.family_members to authenticated;

create policy "family_members: el titular lee los suyos"
  on public.family_members for select to authenticated
  using (user_id = (select auth.uid()));
create policy "family_members: el titular renombra los suyos"
  on public.family_members for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "family_members: el titular borra los suyos"
  on public.family_members for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, delete on public.family_member_allergens to authenticated;
grant insert (member_id, allergen) on public.family_member_allergens to authenticated;

create policy "family_member_allergens: el titular las lee"
  on public.family_member_allergens for select to authenticated
  using ((select private.owns_family_member(member_id)));
create policy "family_member_allergens: el titular las añade con consentimiento"
  on public.family_member_allergens for insert to authenticated
  with check (
    (select private.owns_family_member(member_id))
    and (select private.has_health_consent())
  );
create policy "family_member_allergens: el titular las borra"
  on public.family_member_allergens for delete to authenticated
  using ((select private.owns_family_member(member_id)));

-- ---------------------------------------------------------------------------
-- Alta de un familiar
-- ---------------------------------------------------------------------------
create function public.family_member_limit()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case p.plan when 'premium' then 10 else 1 end
  from public.profiles p where p.id = (select auth.uid());
$$;

create function public.add_family_member(member_name text, guardian_confirmed boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  clean_name text := btrim(member_name);
  new_id uuid;
begin
  if current_user_id is null then
    raise exception 'no hay sesión' using errcode = '42501';
  end if;
  if not (select private.has_health_consent()) then
    raise exception 'falta el consentimiento para datos de salud' using errcode = '42501';
  end if;
  if guardian_confirmed is not true then
    raise exception 'falta la declaración de tutor o permiso' using errcode = '22023';
  end if;
  if clean_name is null or char_length(clean_name) not between 1 and 40 then
    raise exception 'nombre no válido' using errcode = '22023';
  end if;
  -- Bloquea al titular para que dos altas a la vez no se salten el límite.
  perform 1 from public.profiles p where p.id = current_user_id for update;
  if (select count(*) from public.family_members m where m.user_id = current_user_id)
     >= (select public.family_member_limit()) then
    raise exception 'límite de familiares del plan' using errcode = 'SB402';
  end if;

  insert into public.family_members (user_id, name, guardian_confirmed_at)
  values (current_user_id, clean_name, now())
  returning id into new_id;
  return new_id;
end;
$$;

-- Sustituye las alergias de un familiar de una vez (como set_my_allergens).
-- security invoker: RLS comprueba que el familiar es suyo y el consentimiento.
create function public.set_family_member_allergens(
  target_member_id uuid,
  allergens public.allergen[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'no hay sesión' using errcode = '42501';
  end if;
  if allergens is null then
    raise exception 'allergens no puede ser null' using errcode = '22023';
  end if;
  if not (select private.owns_family_member(target_member_id)) then
    raise exception 'familiar no encontrado' using errcode = '42501';
  end if;

  delete from public.family_member_allergens where member_id = target_member_id;
  insert into public.family_member_allergens (member_id, allergen)
  select distinct target_member_id, allergen from unnest(allergens) as allergen;
end;
$$;

revoke all on function public.family_member_limit() from public, anon;
revoke all on function public.add_family_member(text, boolean) from public, anon;
revoke all on function public.set_family_member_allergens(uuid, public.allergen[])
  from public, anon;
grant execute on function public.family_member_limit() to authenticated;
grant execute on function public.add_family_member(text, boolean) to authenticated;
grant execute on function public.set_family_member_allergens(uuid, public.allergen[])
  to authenticated;

-- ---------------------------------------------------------------------------
-- Retirar el consentimiento borra también las alergias de la familia
-- ---------------------------------------------------------------------------
create or replace function private.handle_health_consent_withdrawn()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.user_allergens where user_id = new.id;
  delete from public.family_member_allergens a
  using public.family_members m
  where m.id = a.member_id and m.user_id = new.id;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Plan de una cuenta: lo cambia el admin (mientras no haya pagos)
-- ---------------------------------------------------------------------------
create function public.admin_set_account_plan(target_email text, new_plan public.account_plan)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
begin
  perform private.require_admin();
  if target_email is null or new_plan is null then
    raise exception 'faltan datos' using errcode = '22023';
  end if;
  select u.id into target_id from auth.users u where lower(u.email) = lower(btrim(target_email));
  if target_id is null then
    raise exception 'cuenta no encontrada' using errcode = 'P0002';
  end if;
  update public.profiles set plan = new_plan where id = target_id;
end;
$$;

revoke all on function public.admin_set_account_plan(text, public.account_plan)
  from public, anon, authenticated;
grant execute on function public.admin_set_account_plan(text, public.account_plan)
  to authenticated;
