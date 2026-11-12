-- Verificación de restaurantes: solo el admin verifica, y solo lo publicado Y
-- verificado es visible en la carta pública y en la app.
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

-- O dueño (con términos aceptados), D comensal, X admin.
insert into auth.users (id, email, raw_user_meta_data) values
  ('cccccccc-1010-0000-0000-000000000000', 'dueno@verif.test',
   '{"role": "restaurant_owner", "accepted_terms": true}'),
  ('dddddddd-1010-0000-0000-000000000000', 'comensal@verif.test', '{}'),
  ('eeeeeeee-1010-0000-0000-000000000000', 'admin@verif.test', '{}');
update public.profiles set role = 'admin' where id = 'eeeeeeee-1010-0000-0000-000000000000';

-- --- Restaurante del dueño, publicado (con ids fijos: se inserta sin RLS) ----------
insert into public.restaurants (id, owner_id, name, slug, city, address, published) values
  ('cccccccc-1010-1111-0000-000000000000', 'cccccccc-1010-0000-0000-000000000000',
   'Bar Verif', 'bar-verif', 'Madrid', 'Calle 1', true);
insert into public.dishes (id, restaurant_id, name) values
  ('cccccccc-1010-2222-0000-000000000000', 'cccccccc-1010-1111-0000-000000000000', 'Plato');
insert into public.dish_allergens (dish_id, allergen, level) values
  ('cccccccc-1010-2222-0000-000000000000', 'gluten', 'free_from');

set local role authenticated;
set local request.jwt.claims = '{"sub": "cccccccc-1010-0000-0000-000000000000", "role": "authenticated"}';

select is(
  (select verification_status::text from public.restaurants
    where id = 'cccccccc-1010-1111-0000-000000000000'),
  'pending', 'Un restaurante nuevo nace pendiente de verificación');

select throws_ok(
  $$ insert into public.restaurants (name, slug, city, verification_status)
     values ('Otro', 'otro-verif', 'Madrid', 'verified') $$,
  '42501', null, 'El dueño no puede crear un restaurante ya verificado');
select throws_ok(
  $$ update public.restaurants set verification_status = 'verified'
     where id = 'cccccccc-1010-1111-0000-000000000000' $$,
  '42501', null, 'El dueño no puede verificarse a sí mismo');
select throws_ok(
  $$ select public.admin_set_restaurant_verification(
       'cccccccc-1010-1111-0000-000000000000', 'verified') $$,
  '42501', null, 'El dueño no puede usar la función del administrador');
select throws_ok(
  $$ select * from public.admin_list_restaurants() $$,
  '42501', null, 'El dueño no puede ver la lista del administrador');

-- --- Público: publicado pero sin verificar no se ve --------------------------------
reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select is((select count(*)::int from public.public_restaurants where slug = 'bar-verif'),
  0, 'Publicado pero pendiente: no aparece en la carta pública');
select is((select count(*)::int from public.public_dishes
    where restaurant_id = 'cccccccc-1010-1111-0000-000000000000'),
  0, 'ni sus platos');
select is((select count(*)::int from public.public_dish_allergens
    where dish_id = 'cccccccc-1010-2222-0000-000000000000'),
  0, 'ni sus alérgenos');
select throws_ok(
  $$ select * from public.admin_list_restaurants() $$,
  '42501', null, 'anon no puede ver la lista del administrador');

-- --- Comensal ----------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "dddddddd-1010-0000-0000-000000000000", "role": "authenticated"}';
select throws_ok(
  $$ select public.admin_set_restaurant_verification(
       'cccccccc-1010-1111-0000-000000000000', 'verified') $$,
  '42501', null, 'Un comensal no puede verificar restaurantes');

-- --- Administrador -------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "eeeeeeee-1010-0000-0000-000000000000", "role": "authenticated"}';

select results_eq(
  $$ select name, owner_email, verification_status::text from public.admin_list_restaurants()
     where id = 'cccccccc-1010-1111-0000-000000000000' $$,
  $$ values ('Bar Verif'::text, 'dueno@verif.test'::text, 'pending'::text) $$,
  'El admin ve el restaurante pendiente y el email del dueño para contactarle');

select throws_ok(
  $$ select public.admin_set_restaurant_verification(
       'cccccccc-1010-1111-0000-000000000000', 'rejected', '   ') $$,
  '22023', null, 'Rechazar sin motivo no se permite');
select throws_ok(
  $$ select public.admin_set_restaurant_verification(
       '00000000-1010-0000-0000-000000000000', 'verified') $$,
  'P0002', null, 'Un restaurante que no existe da error');

select lives_ok(
  $$ select public.admin_set_restaurant_verification(
       'cccccccc-1010-1111-0000-000000000000', 'rejected', '  No hemos podido confirmar que seas el dueño. ') $$,
  'El admin rechaza con un motivo');

-- El dueño ve el motivo.
set local request.jwt.claims = '{"sub": "cccccccc-1010-0000-0000-000000000000", "role": "authenticated"}';
select results_eq(
  $$ select verification_status::text, verification_note from public.restaurants
     where id = 'cccccccc-1010-1111-0000-000000000000' $$,
  $$ values ('rejected'::text, 'No hemos podido confirmar que seas el dueño.'::text) $$,
  'El dueño ve el rechazo y el motivo');

set local request.jwt.claims = '{"sub": "eeeeeeee-1010-0000-0000-000000000000", "role": "authenticated"}';
select lives_ok(
  $$ select public.admin_set_restaurant_verification(
       'cccccccc-1010-1111-0000-000000000000', 'verified', 'nota que no se guarda') $$,
  'El admin verifica');
select results_eq(
  $$ select verification_status::text, verification_note is null, verified_at is not null
     from public.admin_list_restaurants() where id = 'cccccccc-1010-1111-0000-000000000000' $$,
  $$ values ('verified'::text, true, true) $$,
  'Al verificar se borra el motivo anterior y se guarda la fecha');

reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select is((select count(*)::int from public.public_restaurants where slug = 'bar-verif'),
  1, 'Publicado y verificado: ya aparece en la carta pública');
select is((select count(*)::int from public.public_dish_allergens
    where dish_id = 'cccccccc-1010-2222-0000-000000000000'),
  1, 'con sus alérgenos');

-- --- El dueño edita su restaurante ------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "cccccccc-1010-0000-0000-000000000000", "role": "authenticated"}';

update public.restaurants set phone = '+34 600 000 001'
  where id = 'cccccccc-1010-1111-0000-000000000000';
insert into public.dishes (restaurant_id, name) values
  ('cccccccc-1010-1111-0000-000000000000', 'Plato nuevo');
select is(
  (select verification_status::text from public.restaurants
    where id = 'cccccccc-1010-1111-0000-000000000000'),
  'verified', 'Cambiar el teléfono o la carta no quita la verificación');

update public.restaurants set name = 'Otro Bar'
  where id = 'cccccccc-1010-1111-0000-000000000000';
select results_eq(
  $$ select verification_status::text, verified_at is null from public.restaurants
     where id = 'cccccccc-1010-1111-0000-000000000000' $$,
  $$ values ('pending'::text, true) $$,
  'Cambiar el nombre vuelve a dejarlo pendiente');

-- Dirección y ciudad, también (se verifica de nuevo como admin, sin RLS).
reset role;
update public.restaurants set verification_status = 'verified'
  where id = 'cccccccc-1010-1111-0000-000000000000';
update public.restaurants set address = 'Calle 2'
  where id = 'cccccccc-1010-1111-0000-000000000000';
select is(
  (select verification_status::text from public.restaurants
    where id = 'cccccccc-1010-1111-0000-000000000000'),
  'pending', 'Cambiar la dirección vuelve a dejarlo pendiente');

update public.restaurants set verification_status = 'rejected', verification_note = 'x'
  where id = 'cccccccc-1010-1111-0000-000000000000';
update public.restaurants set city = 'Zaragoza'
  where id = 'cccccccc-1010-1111-0000-000000000000';
select results_eq(
  $$ select verification_status::text, verification_note is null from public.restaurants
     where id = 'cccccccc-1010-1111-0000-000000000000' $$,
  $$ values ('pending'::text, true) $$,
  'Un restaurante rechazado que cambia sus datos vuelve a pendiente para revisarlo');

select is(
  (select count(*)::int from public.public_restaurants where slug = 'bar-verif'),
  0, 'Pendiente otra vez: deja de verse en la carta pública');

select * from finish();
rollback;
