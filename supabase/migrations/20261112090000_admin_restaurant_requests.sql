-- Gestión de las solicitudes "Pide este restaurante" por parte del administrador.
--
-- Cada solicitud tiene un estado: 'pending' (pendiente) o 'added' (el
-- restaurante ya está en SafeBite). El comensal no puede escribirlo: su permiso
-- de inserción solo cubre restaurant_name y city, así que siempre nace 'pending'.
--
-- El administrador no lee la tabla directamente: usa dos funciones que agrupan
-- por restaurante y ciudad y NO devuelven quién hizo cada solicitud
-- (minimización de datos, RGPD). Ambas fallan si quien llama no es 'admin'.

create extension if not exists unaccent with schema extensions;

create type public.restaurant_request_status as enum ('pending', 'added');

alter table public.restaurant_requests
  add column status public.restaurant_request_status not null default 'pending';

-- Clave para agrupar: sin tildes, en minúsculas y con los espacios normalizados,
-- de modo que «Bar Pepe», «bar pepe » y «Bar  Pépe» cuentan como el mismo.
create function private.request_key(value text)
returns text
language sql
stable
set search_path = ''
as $$
  select lower(btrim(regexp_replace(extensions.unaccent(value), '\s+', ' ', 'g')));
$$;

create function private.require_admin()
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
end;
$$;

-- Resumen agrupado. El estado del grupo es 'pending' mientras quede alguna
-- solicitud pendiente: si alguien vuelve a pedir un restaurante ya marcado como
-- añadido, el grupo reaparece como pendiente para revisarlo.
create function public.admin_request_summary()
returns table (
  restaurant_name text,
  city text,
  name_key text,
  city_key text,
  request_count integer,
  pending_count integer,
  first_requested_at timestamptz,
  last_requested_at timestamptz,
  status public.restaurant_request_status
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();

  return query
  select
    -- Se muestra la forma escrita más recientemente.
    (array_agg(r.restaurant_name order by r.created_at desc))[1],
    (array_agg(r.city order by r.created_at desc))[1],
    private.request_key(r.restaurant_name),
    private.request_key(r.city),
    count(*)::integer,
    (count(*) filter (where r.status = 'pending'))::integer,
    min(r.created_at),
    max(r.created_at),
    case when bool_or(r.status = 'pending')
      then 'pending'::public.restaurant_request_status
      else 'added'::public.restaurant_request_status
    end
  from public.restaurant_requests r
  group by private.request_key(r.restaurant_name), private.request_key(r.city)
  order by bool_or(r.status = 'pending') desc, count(*) desc, max(r.created_at) desc;
end;
$$;

-- Cambia el estado de todas las solicitudes de un grupo. Devuelve cuántas cambian.
create function public.admin_set_request_status(
  target_name_key text,
  target_city_key text,
  new_status public.restaurant_request_status
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated integer;
begin
  perform private.require_admin();
  if target_name_key is null or target_city_key is null or new_status is null then
    raise exception 'faltan datos' using errcode = '22023';
  end if;

  update public.restaurant_requests r
  set status = new_status
  where private.request_key(r.restaurant_name) = target_name_key
    and private.request_key(r.city) = target_city_key
    and r.status is distinct from new_status;
  get diagnostics updated = row_count;
  return updated;
end;
$$;

revoke all on function private.request_key(text) from public, anon, authenticated;
revoke all on function private.require_admin() from public, anon, authenticated;
revoke all on function public.admin_request_summary() from public, anon, authenticated;
revoke all on function public.admin_set_request_status(text, text, public.restaurant_request_status)
  from public, anon, authenticated;
grant execute on function public.admin_request_summary() to authenticated;
grant execute on function public.admin_set_request_status(text, text, public.restaurant_request_status)
  to authenticated;
