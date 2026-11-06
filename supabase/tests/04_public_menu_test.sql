-- Carta pública por QR: solo lectura, solo lo publicado y activo.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, raw_user_meta_data) values
  ('11111111-0000-0000-0000-000000000000', '{"role": "restaurant_owner"}');

insert into public.restaurants (id, owner_id, name, slug, city, published) values
  ('aaaa0000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000000',
   'Publicado', 'publicado', 'Madrid', true),
  ('bbbb0000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000000',
   'Borrador', 'borrador', 'Madrid', false);

insert into public.dishes (id, restaurant_id, name, is_active) values
  ('aaaa0000-1111-0000-0000-000000000000', 'aaaa0000-0000-0000-0000-000000000000', 'Activo', true),
  ('aaaa0000-2222-0000-0000-000000000000', 'aaaa0000-0000-0000-0000-000000000000', 'Inactivo', false),
  ('bbbb0000-1111-0000-0000-000000000000', 'bbbb0000-0000-0000-0000-000000000000', 'De borrador', true);

insert into public.dish_allergens (dish_id, allergen, level) values
  ('aaaa0000-1111-0000-0000-000000000000', 'gluten', 'contains'),
  ('aaaa0000-2222-0000-0000-000000000000', 'gluten', 'contains'),
  ('bbbb0000-1111-0000-0000-000000000000', 'gluten', 'contains');

set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select results_eq(
  $$ select slug from public.public_restaurants $$,
  $$ values ('publicado') $$,
  'anon solo ve restaurantes publicados'
);

select results_eq(
  $$ select name from public.public_dishes $$,
  $$ values ('Activo') $$,
  'anon solo ve platos activos de restaurantes publicados'
);

select results_eq(
  $$ select dish_id from public.public_dish_allergens $$,
  $$ values ('aaaa0000-1111-0000-0000-000000000000'::uuid) $$,
  'anon solo ve alérgenos de platos visibles'
);

select is(
  (select count(*)::int from public.public_restaurants where slug = 'borrador'), 0,
  'Un restaurante sin publicar no es accesible ni filtrando por su slug'
);

select throws_ok($$ select * from public.restaurants $$, '42501', null,
  'anon no puede leer la tabla restaurants');
select throws_ok($$ select * from public.dishes $$, '42501', null,
  'anon no puede leer la tabla dishes');
select throws_ok($$ select * from public.dish_allergens $$, '42501', null,
  'anon no puede leer la tabla dish_allergens');
select throws_ok(
  $$ insert into public.restaurants (name, slug, city) values ('x', 'xxx', 'Madrid') $$,
  '42501', null, 'anon no puede crear restaurantes');
-- Las vistas con joins no son actualizables (55000); la de restaurantes sí lo
-- sería, así que debe fallar por falta de permisos (42501).
select throws_ok(
  $$ update public.public_restaurants set name = 'Hackeado' $$,
  '42501', null, 'La vista pública de restaurantes es de solo lectura');
select throws_ok(
  $$ delete from public.public_dishes $$,
  null, null, 'La vista pública de platos es de solo lectura');
select throws_ok(
  $$ update public.public_dish_allergens set level = 'free_from' $$,
  null, null, 'La vista pública de alérgenos es de solo lectura');

-- Un comensal registrado ve lo mismo que anon en las vistas públicas.
reset role;
insert into auth.users (id) values ('dddddddd-0000-0000-0000-000000000000');
set local role authenticated;
set local request.jwt.claims = '{"sub": "dddddddd-0000-0000-0000-000000000000", "role": "authenticated"}';

select results_eq(
  $$ select name from public.public_dishes $$,
  $$ values ('Activo') $$,
  'Un comensal registrado solo ve platos activos de restaurantes publicados'
);

select * from finish();
rollback;
