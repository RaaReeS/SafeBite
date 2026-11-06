-- Permisos, políticas RLS y vistas públicas.
--
-- Principios:
-- 1. Datos de salud (user_allergens) y perfiles: solo su propietario.
-- 2. Restaurantes, platos y alérgenos: el propietario gestiona los suyos.
-- 3. La carta pública se lee SOLO a través de las vistas public_*, que muestran
--    restaurantes publicados y platos activos, sin owner_id.
-- 4. anon no tiene ningún acceso a las tablas base.
-- 5. Permisos por columna: el cliente nunca puede escribir id, owner_id, role
--    ni timestamps.

-- ---------------------------------------------------------------------------
-- Funciones auxiliares (security definer para evitar recursión entre políticas)
-- ---------------------------------------------------------------------------
create function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid());
$$;

create function private.has_health_consent()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.health_data_consent_at is not null
  );
$$;

create function private.owns_restaurant(target_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.restaurants r
    where r.id = target_restaurant_id and r.owner_id = (select auth.uid())
  );
$$;

create function private.owns_dish(target_dish_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.dishes d
    join public.restaurants r on r.id = d.restaurant_id
    where d.id = target_dish_id and r.owner_id = (select auth.uid())
  );
$$;

revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function
  private.current_user_role(),
  private.has_health_consent(),
  private.owns_restaurant(uuid),
  private.owns_dish(uuid)
to authenticated;

-- ---------------------------------------------------------------------------
-- Partimos de cero: se retiran los permisos por defecto de Supabase.
-- ---------------------------------------------------------------------------
revoke all on
  public.profiles,
  public.user_allergens,
  public.restaurants,
  public.dishes,
  public.dish_allergens,
  public.restaurant_requests
from anon, authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
grant select on public.profiles to authenticated;
grant update (display_name, health_data_consent_at) on public.profiles to authenticated;

create policy "profiles: el usuario lee su perfil"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: el usuario edita su perfil"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- user_allergens (datos de salud)
-- ---------------------------------------------------------------------------
grant select, delete on public.user_allergens to authenticated;
grant insert (user_id, allergen) on public.user_allergens to authenticated;

create policy "user_allergens: el usuario lee sus alergias"
  on public.user_allergens for select to authenticated
  using (user_id = (select auth.uid()));

create policy "user_allergens: el usuario añade sus alergias con consentimiento"
  on public.user_allergens for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.has_health_consent()));

create policy "user_allergens: el usuario borra sus alergias"
  on public.user_allergens for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- restaurants
-- ---------------------------------------------------------------------------
grant select, delete on public.restaurants to authenticated;
grant insert (name, slug, city, address, phone, contact_email, latitude, longitude, published),
  update (name, slug, city, address, phone, contact_email, latitude, longitude, published)
  on public.restaurants to authenticated;

create policy "restaurants: el propietario lee los suyos"
  on public.restaurants for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "restaurants: solo restaurant_owner crea restaurantes propios"
  on public.restaurants for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (select private.current_user_role()) = 'restaurant_owner'
  );

create policy "restaurants: el propietario edita los suyos"
  on public.restaurants for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "restaurants: el propietario borra los suyos"
  on public.restaurants for delete to authenticated
  using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- dishes
-- ---------------------------------------------------------------------------
grant select, delete on public.dishes to authenticated;
grant insert (restaurant_id, name, description, price_cents, category, ingredients, is_active, sort_order),
  update (restaurant_id, name, description, price_cents, category, ingredients, is_active, sort_order)
  on public.dishes to authenticated;

create policy "dishes: el propietario lee los platos de sus restaurantes"
  on public.dishes for select to authenticated
  using ((select private.owns_restaurant(restaurant_id)));

create policy "dishes: el propietario crea platos en sus restaurantes"
  on public.dishes for insert to authenticated
  with check ((select private.owns_restaurant(restaurant_id)));

create policy "dishes: el propietario edita platos de sus restaurantes"
  on public.dishes for update to authenticated
  using ((select private.owns_restaurant(restaurant_id)))
  with check ((select private.owns_restaurant(restaurant_id)));

create policy "dishes: el propietario borra platos de sus restaurantes"
  on public.dishes for delete to authenticated
  using ((select private.owns_restaurant(restaurant_id)));

-- ---------------------------------------------------------------------------
-- dish_allergens
-- ---------------------------------------------------------------------------
grant select, delete on public.dish_allergens to authenticated;
grant insert (dish_id, allergen, level), update (dish_id, allergen, level)
  on public.dish_allergens to authenticated;

create policy "dish_allergens: el propietario lee los alérgenos de sus platos"
  on public.dish_allergens for select to authenticated
  using ((select private.owns_dish(dish_id)));

create policy "dish_allergens: el propietario declara alérgenos de sus platos"
  on public.dish_allergens for insert to authenticated
  with check ((select private.owns_dish(dish_id)));

create policy "dish_allergens: el propietario edita alérgenos de sus platos"
  on public.dish_allergens for update to authenticated
  using ((select private.owns_dish(dish_id)))
  with check ((select private.owns_dish(dish_id)));

create policy "dish_allergens: el propietario borra alérgenos de sus platos"
  on public.dish_allergens for delete to authenticated
  using ((select private.owns_dish(dish_id)));

-- ---------------------------------------------------------------------------
-- restaurant_requests
-- ---------------------------------------------------------------------------
grant select on public.restaurant_requests to authenticated;
grant insert (restaurant_name, city) on public.restaurant_requests to authenticated;

create policy "restaurant_requests: el usuario lee sus solicitudes"
  on public.restaurant_requests for select to authenticated
  using (user_id = (select auth.uid()));

create policy "restaurant_requests: el usuario crea solicitudes propias"
  on public.restaurant_requests for insert to authenticated
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Vistas públicas (carta por QR y búsqueda en la app)
--
-- Se ejecutan con los permisos de su propietario (security_invoker = false),
-- de modo que anon puede leerlas sin tener acceso a las tablas base. El filtro
-- de la propia vista es la barrera: solo restaurantes publicados y platos
-- activos, y nunca owner_id. security_barrier impide que filtros del cliente
-- se evalúen antes que el de la vista.
-- ---------------------------------------------------------------------------
create view public.public_restaurants
with (security_invoker = false, security_barrier = true)
as
select r.id, r.name, r.slug, r.city, r.address, r.phone, r.contact_email, r.latitude, r.longitude
from public.restaurants r
where r.published;

create view public.public_dishes
with (security_invoker = false, security_barrier = true)
as
select d.id, d.restaurant_id, d.name, d.description, d.price_cents, d.category, d.ingredients,
  d.sort_order
from public.dishes d
join public.restaurants r on r.id = d.restaurant_id
where r.published and d.is_active;

create view public.public_dish_allergens
with (security_invoker = false, security_barrier = true)
as
select da.dish_id, da.allergen, da.level
from public.dish_allergens da
join public.dishes d on d.id = da.dish_id
join public.restaurants r on r.id = d.restaurant_id
where r.published and d.is_active;

revoke all on public.public_restaurants, public.public_dishes, public.public_dish_allergens
  from anon, authenticated;
grant select on public.public_restaurants, public.public_dishes, public.public_dish_allergens
  to anon, authenticated;
