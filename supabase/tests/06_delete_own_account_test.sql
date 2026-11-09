-- Derecho de supresión: delete_own_account() solo borra la cuenta de quien la ejecuta.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

-- A y B comensales con alergias; O dueño con restaurante, plato y alérgenos.
insert into auth.users (id, raw_user_meta_data) values
  ('aaaaaaaa-6666-0000-0000-000000000000', '{}'),
  ('bbbbbbbb-6666-0000-0000-000000000000', '{}'),
  ('cccccccc-6666-0000-0000-000000000000', '{"role": "restaurant_owner", "accepted_terms": true}');

update public.profiles set health_data_consent_at = now()
  where id in ('aaaaaaaa-6666-0000-0000-000000000000', 'bbbbbbbb-6666-0000-0000-000000000000');
insert into public.user_allergens (user_id, allergen) values
  ('aaaaaaaa-6666-0000-0000-000000000000', 'gluten'),
  ('bbbbbbbb-6666-0000-0000-000000000000', 'milk');
insert into public.restaurant_requests (user_id, restaurant_name, city) values
  ('aaaaaaaa-6666-0000-0000-000000000000', 'Bar Pepe', 'Madrid');

insert into public.restaurants (id, owner_id, name, slug, city) values
  ('cccccccc-6666-1111-0000-000000000000', 'cccccccc-6666-0000-0000-000000000000',
   'Casa O', 'casa-o-supresion', 'Madrid');
insert into public.dishes (id, restaurant_id, name) values
  ('cccccccc-6666-2222-0000-000000000000', 'cccccccc-6666-1111-0000-000000000000', 'Plato O');
insert into public.dish_allergens (dish_id, allergen, level) values
  ('cccccccc-6666-2222-0000-000000000000', 'eggs', 'contains');

-- --- Anónimo ----------------------------------------------------------------
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select throws_ok(
  $$ select public.delete_own_account() $$, '42501', null,
  'anon no puede ejecutar delete_own_account'
);

-- --- Sesión sin usuario -----------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims = '{"role": "authenticated"}';
select throws_ok(
  $$ select public.delete_own_account() $$, '42501', null,
  'Sin usuario en la sesión no se borra nada'
);

-- --- Comensal A borra su cuenta ---------------------------------------------
set local request.jwt.claims = '{"sub": "aaaaaaaa-6666-0000-0000-000000000000", "role": "authenticated"}';
select lives_ok($$ select public.delete_own_account() $$, 'A puede borrar su propia cuenta');

reset role;
select is((select count(*)::int from auth.users where id = 'aaaaaaaa-6666-0000-0000-000000000000'),
  0, 'Se borra el usuario de A');
select is((select count(*)::int from public.profiles where id = 'aaaaaaaa-6666-0000-0000-000000000000'),
  0, 'Se borra el perfil de A');
select is((select count(*)::int from public.user_allergens where user_id = 'aaaaaaaa-6666-0000-0000-000000000000'),
  0, 'Se borran las alergias de A (datos de salud)');
select is((select count(*)::int from public.restaurant_requests where user_id = 'aaaaaaaa-6666-0000-0000-000000000000'),
  0, 'Se borran las solicitudes de alta de A');
select is((select count(*)::int from public.user_allergens where user_id = 'bbbbbbbb-6666-0000-0000-000000000000'),
  1, 'Las alergias de B no se tocan');
select is((select count(*)::int from auth.users where id in (
    'bbbbbbbb-6666-0000-0000-000000000000', 'cccccccc-6666-0000-0000-000000000000')),
  2, 'Las demás cuentas siguen existiendo');

-- --- Dueño O borra su cuenta ------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "cccccccc-6666-0000-0000-000000000000", "role": "authenticated"}';
select public.delete_own_account();
reset role;

select is((select count(*)::int from public.restaurants where id = 'cccccccc-6666-1111-0000-000000000000'),
  0, 'Al borrar la cuenta de un dueño se borran sus restaurantes');
select is((select count(*)::int from public.dishes where id = 'cccccccc-6666-2222-0000-000000000000'),
  0, 'y sus platos');
select is((select count(*)::int from public.dish_allergens where dish_id = 'cccccccc-6666-2222-0000-000000000000'),
  0, 'y sus alérgenos declarados');

select * from finish();
rollback;
