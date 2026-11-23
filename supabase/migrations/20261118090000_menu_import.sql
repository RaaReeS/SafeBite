-- Importar la carta desde fotos o PDF (lectura con IA en el servidor de la web).
--
-- 1) Alérgenos PROPUESTOS de cada plato, aparte de las declaraciones: no cuentan
--    para el filtro hasta que el dueño los confirma (se guardan en dish_allergens).
--    Nunca «no contiene». No salen en las vistas públicas.
-- 2) Límite de lecturas: 5 lecturas buenas al día por restaurante y, como mucho,
--    15 intentos (los que fallan no gastan las buenas). Error propio SB429.

-- Lista de {allergen, level} con un alérgeno oficial y «contiene» o «puede contener».
create function private.valid_allergen_suggestions(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(value) = 'array'
    and not exists (
      select 1
      from jsonb_array_elements(value) as item
      where jsonb_typeof(item) <> 'object'
        or not (item ->> 'allergen') = any (enum_range(null::public.allergen)::text[])
        or (item ->> 'allergen') is null
        or coalesce(item ->> 'level', '') not in ('contains', 'may_contain')
    );
$$;

revoke all on function private.valid_allergen_suggestions(jsonb) from public, anon;
grant execute on function private.valid_allergen_suggestions(jsonb) to authenticated;

alter table public.dishes
  add column allergen_suggestions jsonb not null default '[]'::jsonb
  constraint dishes_allergen_suggestions_valid
    check (private.valid_allergen_suggestions(allergen_suggestions));

-- El dueño crea y edita las propuestas (las mismas políticas RLS de dishes).
grant insert (allergen_suggestions), update (allergen_suggestions)
  on public.dishes to authenticated;

-- ---------------------------------------------------------------------------
-- Lecturas de cartas (para el límite diario).
-- ---------------------------------------------------------------------------
create table public.menu_imports (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  -- Lo marca el servidor cuando el servicio ha leído la carta.
  succeeded boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.menu_imports enable row level security;
revoke all on public.menu_imports from anon, authenticated;
grant select on public.menu_imports to authenticated;

create index menu_imports_restaurant_created_idx
  on public.menu_imports (restaurant_id, created_at);

create policy "menu_imports: el propietario ve las lecturas de sus restaurantes"
  on public.menu_imports for select to authenticated
  using ((select private.owns_restaurant(restaurant_id)));

-- Registra un intento de leer la carta y devuelve su id. Solo el dueño del
-- restaurante; en las últimas 24 horas, como mucho 5 lecturas buenas y 15
-- intentos (si no, SB429 y no se registra nada).
create function public.register_menu_import(p_restaurant_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not private.owns_restaurant(p_restaurant_id) then
    raise exception 'solo el dueño del restaurante puede leer su carta'
      using errcode = '42501';
  end if;
  -- Bloqueo por restaurante: dos lecturas a la vez no se saltan el límite.
  perform 1 from public.restaurants where id = p_restaurant_id for update;
  if exists (
    select 1
    from public.menu_imports m
    where m.restaurant_id = p_restaurant_id
      and m.created_at > now() - interval '24 hours'
    having count(*) filter (where m.succeeded) >= 5 or count(*) >= 15
  ) then
    raise exception 'demasiadas lecturas de la carta en 24 horas'
      using errcode = 'SB429';
  end if;
  insert into public.menu_imports (restaurant_id) values (p_restaurant_id)
    returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.register_menu_import(uuid) from public, anon;
grant execute on function public.register_menu_import(uuid) to authenticated;

-- Marca un intento como lectura buena (lo llama el servidor tras leer la carta).
-- Solo endurece el límite: no hay forma de «devolver» una lectura.
create function public.complete_menu_import(p_import_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.menu_imports m
    set succeeded = true
    where m.id = p_import_id and private.owns_restaurant(m.restaurant_id);
  if not found then
    raise exception 'lectura no encontrada' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.complete_menu_import(uuid) from public, anon;
grant execute on function public.complete_menu_import(uuid) to authenticated;
