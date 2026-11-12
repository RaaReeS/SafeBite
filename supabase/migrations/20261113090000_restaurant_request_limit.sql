-- Límite de solicitudes "Pide este restaurante": como mucho 20 por usuario en
-- las últimas 24 horas, para que nadie pueda llenar la base de datos.
--
-- Al superarlo se lanza el error SB429 (código propio): la app lo reconoce y
-- explica que hay que esperar.

create function private.limit_restaurant_requests()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*)
    from public.restaurant_requests r
    where r.user_id = new.user_id
      and r.created_at > now() - interval '24 hours'
  ) >= 20 then
    raise exception 'demasiadas solicitudes de restaurantes en 24 horas'
      using errcode = 'SB429';
  end if;
  return new;
end;
$$;

revoke all on function private.limit_restaurant_requests() from public, anon, authenticated;

create trigger restaurant_requests_limit
  before insert on public.restaurant_requests
  for each row execute function private.limit_restaurant_requests();

create index restaurant_requests_user_created_idx
  on public.restaurant_requests (user_id, created_at);
