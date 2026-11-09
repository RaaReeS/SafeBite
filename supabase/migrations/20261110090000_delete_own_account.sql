-- Derecho de supresión (RGPD, art. 17): un usuario puede borrar su propia cuenta.
--
-- Sin parámetros a propósito: solo puede borrar la cuenta de quien la ejecuta.
-- Al borrar auth.users se borran en cascada el perfil, las alergias, las
-- solicitudes de alta y, si es dueño, sus restaurantes, platos y alérgenos.
--
-- security definer porque el usuario no tiene permisos sobre auth.users.
create function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'no hay sesión' using errcode = '42501';
  end if;

  delete from auth.users where id = current_user_id;
end;
$$;

revoke all on function public.delete_own_account() from public, anon, authenticated;
grant execute on function public.delete_own_account() to authenticated;
