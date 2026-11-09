-- Perfiles y datos de salud: cada usuario solo accede a lo suyo (RGPD, art. 9).
begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

-- Usuarios de prueba: A y B comensales, O dueño de restaurante.
insert into auth.users (id, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000000', '{"display_name": "A"}'),
  ('bbbbbbbb-0000-0000-0000-000000000000', '{"display_name": "B"}'),
  ('cccccccc-0000-0000-0000-000000000000', '{"role": "restaurant_owner"}');

select is(
  (select count(*)::int from public.profiles where id in (
     'aaaaaaaa-0000-0000-0000-000000000000',
     'bbbbbbbb-0000-0000-0000-000000000000',
     'cccccccc-0000-0000-0000-000000000000')), 3,
  'Se crea un perfil por cada usuario registrado'
);

-- --- Usuario A --------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "aaaaaaaa-0000-0000-0000-000000000000", "role": "authenticated"}';

select is(
  (select count(*)::int from public.profiles), 1,
  'A solo ve su propio perfil'
);

select throws_ok(
  $$ insert into public.user_allergens (user_id, allergen)
     values ('aaaaaaaa-0000-0000-0000-000000000000', 'gluten') $$,
  '42501', null,
  'A no puede guardar alergias sin dar el consentimiento de datos de salud'
);

select lives_ok(
  $$ update public.profiles set health_data_consent_at = now()
     where id = 'aaaaaaaa-0000-0000-0000-000000000000' $$,
  'A puede dar su consentimiento'
);

select lives_ok(
  $$ insert into public.user_allergens (user_id, allergen) values
     ('aaaaaaaa-0000-0000-0000-000000000000', 'gluten'),
     ('aaaaaaaa-0000-0000-0000-000000000000', 'milk') $$,
  'Con consentimiento, A puede guardar sus alergias'
);

select is(
  (select count(*)::int from public.user_allergens), 2,
  'A ve sus alergias'
);

select throws_ok(
  $$ insert into public.user_allergens (user_id, allergen)
     values ('bbbbbbbb-0000-0000-0000-000000000000', 'eggs') $$,
  '42501', null,
  'A no puede guardar alergias en el perfil de B'
);

select throws_ok(
  $$ update public.profiles set role = 'admin'
     where id = 'aaaaaaaa-0000-0000-0000-000000000000' $$,
  '42501', null,
  'A no puede cambiar su propio rol'
);

select throws_ok(
  $$ insert into public.profiles (id) values (gen_random_uuid()) $$,
  '42501', null,
  'A no puede crear perfiles directamente'
);

update public.profiles set display_name = 'Hackeado'
  where id = 'bbbbbbbb-0000-0000-0000-000000000000';
select is(
  (select count(*)::int from public.profiles where display_name = 'Hackeado'), 0,
  'A no puede editar el perfil de B'
);

-- --- Usuario B --------------------------------------------------------------
set local request.jwt.claims = '{"sub": "bbbbbbbb-0000-0000-0000-000000000000", "role": "authenticated"}';

select is(
  (select count(*)::int from public.user_allergens), 0,
  'B no ve las alergias de A'
);

delete from public.user_allergens where user_id = 'aaaaaaaa-0000-0000-0000-000000000000';

-- --- Dueño de restaurante O -------------------------------------------------
set local request.jwt.claims = '{"sub": "cccccccc-0000-0000-0000-000000000000", "role": "authenticated"}';

select is(
  (select count(*)::int from public.user_allergens), 0,
  'Un restaurante no ve las alergias de ningún usuario'
);
select is(
  (select count(*)::int from public.profiles where id <> 'cccccccc-0000-0000-0000-000000000000'), 0,
  'Un restaurante no ve perfiles de otros usuarios'
);

-- --- Anónimo ----------------------------------------------------------------
reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select throws_ok(
  $$ select * from public.user_allergens $$, '42501', null,
  'anon no puede leer alergias'
);
select throws_ok(
  $$ select * from public.profiles $$, '42501', null,
  'anon no puede leer perfiles'
);

-- --- Comprobaciones como superusuario ---------------------------------------
reset role;

select is(
  (select count(*)::int from public.user_allergens
   where user_id = 'aaaaaaaa-0000-0000-0000-000000000000'), 2,
  'B no pudo borrar las alergias de A'
);

-- Retirada del consentimiento por A: se borran sus alergias.
set local role authenticated;
set local request.jwt.claims = '{"sub": "aaaaaaaa-0000-0000-0000-000000000000", "role": "authenticated"}';
update public.profiles set health_data_consent_at = null
  where id = 'aaaaaaaa-0000-0000-0000-000000000000';
reset role;

select is(
  (select count(*)::int from public.user_allergens
   where user_id = 'aaaaaaaa-0000-0000-0000-000000000000'), 0,
  'Al retirar el consentimiento se borran las alergias guardadas'
);

-- Derecho de supresión: borrar la cuenta borra perfil y alergias.
insert into public.user_allergens (user_id, allergen)
  values ('bbbbbbbb-0000-0000-0000-000000000000', 'fish');
delete from auth.users where id = 'bbbbbbbb-0000-0000-0000-000000000000';

select is(
  (select count(*)::int from public.profiles where id = 'bbbbbbbb-0000-0000-0000-000000000000'), 0,
  'Al borrar la cuenta se borra el perfil'
);
select is(
  (select count(*)::int from public.user_allergens where user_id = 'bbbbbbbb-0000-0000-0000-000000000000'), 0,
  'Al borrar la cuenta se borran las alergias'
);

select * from finish();
rollback;
