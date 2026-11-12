-- El administrador decide qué cartas ven las personas con alergias, así que su
-- cuenta exige verificación en dos pasos (TOTP). No basta con protegerlo en la
-- web: las funciones de administración también exigen una sesión con el
-- segundo paso hecho (aal2). Con solo la contraseña (aal1), fallan.

create or replace function private.require_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select private.current_user_role()) is distinct from 'admin' then
    raise exception 'solo el administrador' using errcode = '42501';
  end if;
  if coalesce((select auth.jwt() ->> 'aal'), '') <> 'aal2' then
    raise exception 'el administrador debe completar la verificación en dos pasos'
      using errcode = '42501';
  end if;
end;
$$;
