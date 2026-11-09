-- Guardado atómico del perfil de alergias del usuario.
--
-- Borrar las alergias anteriores e insertar las nuevas en dos llamadas
-- separadas podría dejar el perfil VACÍO si la segunda falla (p. ej. por un
-- corte de red), y entonces la carta marcaría como aptos platos que no lo son.
-- Aquí todo ocurre en una sola transacción: o se guarda todo o no cambia nada.
--
-- security invoker: se ejecuta con los permisos del usuario, así que siguen
-- aplicándose RLS y la exigencia de consentimiento para datos de salud.
create function public.set_my_allergens(allergens public.allergen[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'no hay sesión' using errcode = '42501';
  end if;
  if allergens is null then
    raise exception 'allergens no puede ser null' using errcode = '22023';
  end if;

  delete from public.user_allergens where user_id = current_user_id;

  -- Sin consentimiento, la política de inserción lo rechaza (42501) y se
  -- deshace también el borrado anterior.
  insert into public.user_allergens (user_id, allergen)
  select distinct current_user_id, allergen
  from unnest(allergens) as allergen;
end;
$$;

revoke all on function public.set_my_allergens(public.allergen[]) from public, anon, authenticated;
grant execute on function public.set_my_allergens(public.allergen[]) to authenticated;
