-- Aceptación de términos de uso y guardado atómico de alérgenos de un plato.

-- ---------------------------------------------------------------------------
-- Términos de uso (cláusula de responsabilidad: la información la declara el
-- establecimiento). Se registra en el alta si el formulario envía
-- accepted_terms = true en los metadatos. El cliente no puede modificarla
-- después (no hay permiso UPDATE sobre la columna).
-- ---------------------------------------------------------------------------
alter table public.profiles add column terms_accepted_at timestamptz;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, role, display_name, terms_accepted_at)
  values (
    new.id,
    case
      when requested_role = 'restaurant_owner' then 'restaurant_owner'::public.user_role
      else 'diner'::public.user_role
    end,
    left(new.raw_user_meta_data ->> 'display_name', 100),
    case
      when new.raw_user_meta_data -> 'accepted_terms' = 'true'::jsonb then now()
    end
  );
  return new;
end;
$$;

create function private.has_accepted_terms()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.terms_accepted_at is not null
  );
$$;

revoke all on function private.has_accepted_terms() from public, anon, authenticated;
grant execute on function private.has_accepted_terms() to authenticated;

-- Crear un restaurante exige rol restaurant_owner y términos aceptados.
drop policy "restaurants: solo restaurant_owner crea restaurantes propios" on public.restaurants;

create policy "restaurants: solo restaurant_owner con términos aceptados crea restaurantes propios"
  on public.restaurants for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (select private.current_user_role()) = 'restaurant_owner'
    and (select private.has_accepted_terms())
  );

-- ---------------------------------------------------------------------------
-- set_dish_allergens: sustituye todas las declaraciones de un plato en una sola
-- transacción. O se guarda todo o nada: nunca queda una declaración a medias.
--
-- security invoker: se ejecuta con los permisos del usuario, así que RLS y los
-- permisos por columna se siguen aplicando.
--
-- declarations: [{"allergen": "gluten", "level": "contains"}, ...]
-- Un alérgeno que no aparece queda "sin declarar" (sin datos).
-- ---------------------------------------------------------------------------
create function public.set_dish_allergens(target_dish_id uuid, declarations jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if declarations is null or jsonb_typeof(declarations) <> 'array' then
    raise exception 'declarations debe ser un array JSON' using errcode = '22023';
  end if;

  -- Error explícito en vez de un borrado silencioso de 0 filas.
  if not (select private.owns_dish(target_dish_id)) then
    raise exception 'plato no encontrado' using errcode = '42501';
  end if;

  delete from public.dish_allergens where dish_id = target_dish_id;

  -- Un alérgeno o nivel inválido falla el cast (22P02); uno ausente, el NOT NULL
  -- (23502); uno repetido, la clave primaria (23505). En todos los casos se
  -- deshace también el borrado anterior.
  insert into public.dish_allergens (dish_id, allergen, level)
  select
    target_dish_id,
    (declaration ->> 'allergen')::public.allergen,
    (declaration ->> 'level')::public.allergen_level
  from jsonb_array_elements(declarations) as declaration;
end;
$$;

revoke all on function public.set_dish_allergens(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.set_dish_allergens(uuid, jsonb) to authenticated;
