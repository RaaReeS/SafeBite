-- Verificación de restaurantes por el administrador.
--
-- Cualquiera puede registrarse como restaurante. Para que nadie publique la
-- carta de un local que no es suyo (en una app de alergias, una carta falsa
-- puede hacer daño), un restaurante solo es visible en la app y en su QR si
-- está publicado Y verificado por el administrador.
--
-- - El dueño no puede tocar el estado: no tiene permiso sobre esas columnas.
-- - Si cambia el nombre, la ciudad o la dirección de un restaurante verificado
--   (o rechazado), vuelve a quedar pendiente.
-- - Al rechazar, el administrador escribe un motivo que el dueño ve.

create type public.restaurant_verification_status as enum ('pending', 'verified', 'rejected');

alter table public.restaurants
  add column verification_status public.restaurant_verification_status not null default 'pending',
  add column verification_note text
    check (verification_note is null or char_length(verification_note) between 1 and 500),
  add column verified_at timestamptz;

-- ---------------------------------------------------------------------------
-- Vuelve a pendiente si cambian los datos que identifican al local.
-- ---------------------------------------------------------------------------
create function private.reset_restaurant_verification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.verification_status <> 'pending'
     and (new.name, new.city, new.address) is distinct from (old.name, old.city, old.address) then
    new.verification_status := 'pending';
    new.verification_note := null;
    new.verified_at := null;
  end if;
  return new;
end;
$$;

revoke all on function private.reset_restaurant_verification() from public, anon, authenticated;

create trigger restaurants_reset_verification
  before update on public.restaurants
  for each row execute function private.reset_restaurant_verification();

-- ---------------------------------------------------------------------------
-- Vistas públicas: publicado Y verificado.
-- ---------------------------------------------------------------------------
create or replace view public.public_restaurants
with (security_invoker = false, security_barrier = true)
as
select r.id, r.name, r.slug, r.city, r.address, r.phone, r.contact_email, r.latitude, r.longitude
from public.restaurants r
where r.published and r.verification_status = 'verified';

create or replace view public.public_dishes
with (security_invoker = false, security_barrier = true)
as
select d.id, d.restaurant_id, d.name, d.description, d.price_cents, d.category, d.ingredients,
  d.sort_order
from public.dishes d
join public.restaurants r on r.id = d.restaurant_id
where r.published and r.verification_status = 'verified' and d.is_active;

create or replace view public.public_dish_allergens
with (security_invoker = false, security_barrier = true)
as
select da.dish_id, da.allergen, da.level
from public.dish_allergens da
join public.dishes d on d.id = da.dish_id
join public.restaurants r on r.id = d.restaurant_id
where r.published and r.verification_status = 'verified' and d.is_active;

-- ---------------------------------------------------------------------------
-- Funciones del administrador
-- ---------------------------------------------------------------------------

-- Restaurantes con los datos necesarios para comprobar la identidad del dueño
-- (incluido el email de su cuenta, para contactarle). Solo para admin.
create function public.admin_list_restaurants()
returns table (
  id uuid,
  name text,
  slug text,
  city text,
  address text,
  phone text,
  contact_email text,
  published boolean,
  owner_email text,
  created_at timestamptz,
  verification_status public.restaurant_verification_status,
  verification_note text,
  verified_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();

  return query
  select r.id, r.name, r.slug, r.city, r.address, r.phone, r.contact_email, r.published,
    u.email::text, r.created_at, r.verification_status, r.verification_note, r.verified_at
  from public.restaurants r
  join auth.users u on u.id = r.owner_id
  order by
    case r.verification_status when 'pending' then 0 when 'rejected' then 1 else 2 end,
    r.created_at;
end;
$$;

-- Verifica, rechaza (con motivo obligatorio) o devuelve a pendiente un restaurante.
create function public.admin_set_restaurant_verification(
  target_restaurant_id uuid,
  new_status public.restaurant_verification_status,
  note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_note text := nullif(btrim(note), '');
begin
  perform private.require_admin();
  if target_restaurant_id is null or new_status is null then
    raise exception 'faltan datos' using errcode = '22023';
  end if;
  if new_status = 'rejected' and clean_note is null then
    raise exception 'al rechazar hay que indicar el motivo' using errcode = '22023';
  end if;

  update public.restaurants r
  set verification_status = new_status,
      verification_note = case when new_status = 'rejected' then clean_note end,
      verified_at = case when new_status = 'verified' then now() end
  where r.id = target_restaurant_id;

  if not found then
    raise exception 'restaurante no encontrado' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_list_restaurants() from public, anon, authenticated;
revoke all on function public.admin_set_restaurant_verification(
  uuid, public.restaurant_verification_status, text) from public, anon, authenticated;
grant execute on function public.admin_list_restaurants() to authenticated;
grant execute on function public.admin_set_restaurant_verification(
  uuid, public.restaurant_verification_status, text) to authenticated;
