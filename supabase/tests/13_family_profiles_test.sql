-- Perfiles de familia: datos de salud de terceros, solo para el titular.
begin;
create extension if not exists pgtap with schema extensions;
select plan(28);

-- A titular con consentimiento (gratis), B otro comensal, C sin consentimiento,
-- O dueño de restaurante, X admin (con aal2), P titular premium.
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-1313-0000-0000-000000000000', 'a@familia.test', '{}'),
  ('bbbbbbbb-1313-0000-0000-000000000000', 'b@familia.test', '{}'),
  ('cccccccc-1313-0000-0000-000000000000', 'c@familia.test', '{}'),
  ('dddddddd-1313-0000-0000-000000000000', 'o@familia.test',
   '{"role": "restaurant_owner", "accepted_terms": true}'),
  ('eeeeeeee-1313-0000-0000-000000000000', 'x@familia.test', '{}'),
  ('ffffffff-1313-0000-0000-000000000000', 'p@familia.test', '{}');
update public.profiles set health_data_consent_at = now()
  where id in ('aaaaaaaa-1313-0000-0000-000000000000', 'bbbbbbbb-1313-0000-0000-000000000000',
               'ffffffff-1313-0000-0000-000000000000');
update public.profiles set role = 'admin' where id = 'eeeeeeee-1313-0000-0000-000000000000';
update public.profiles set plan = 'premium' where id = 'ffffffff-1313-0000-0000-000000000000';

set local role authenticated;

-- --- Titular A (plan gratis) ---------------------------------------------------
set local request.jwt.claims = '{"sub": "aaaaaaaa-1313-0000-0000-000000000000", "role": "authenticated"}';

select is((select plan::text from public.profiles where id = 'aaaaaaaa-1313-0000-0000-000000000000'),
  'free', 'Las cuentas nacen con el plan gratis');
select throws_ok($$ update public.profiles set plan = 'premium'
                    where id = 'aaaaaaaa-1313-0000-0000-000000000000' $$,
  '42501', null, 'El usuario no puede hacerse premium a sí mismo');
select is(public.family_member_limit(), 1, 'Con el plan gratis, 1 familiar');

select throws_ok($$ select public.add_family_member('Lucía', false) $$, '22023', null,
  'Sin declarar que es tutor o tiene permiso, no se añade');
select throws_ok($$ select public.add_family_member('   ', true) $$, '22023', null,
  'Sin nombre, no se añade');
select throws_ok($$ insert into public.family_members (user_id, name, guardian_confirmed_at)
                    values ('aaaaaaaa-1313-0000-0000-000000000000', 'Directo', now()) $$,
  '42501', null, 'No se puede insertar directamente (solo con add_family_member)');

select lives_ok($$ select public.add_family_member('  Lucía ', true) $$, 'A añade a Lucía');
select is((select name from public.family_members), 'Lucía', 'Se guarda el nombre sin espacios');
select throws_ok($$ select public.add_family_member('Pablo', true) $$, 'SB402', null,
  'Con el plan gratis no se puede añadir un segundo familiar');

select lives_ok(
  $$ select public.set_family_member_allergens(
       (select id from public.family_members where name = 'Lucía'),
       array['milk', 'eggs', 'milk']::public.allergen[]) $$,
  'A guarda las alergias de Lucía');
select results_eq(
  $$ select allergen::text from public.family_member_allergens order by 1 $$,
  $$ values ('eggs'), ('milk') $$, 'Sin duplicados');
select lives_ok(
  $$ select public.set_family_member_allergens(
       (select id from public.family_members where name = 'Lucía'),
       array['nuts']::public.allergen[]) $$,
  'Un nuevo guardado sustituye al anterior');
select results_eq($$ select allergen::text from public.family_member_allergens $$,
  $$ values ('nuts') $$, 'Solo queda lo último guardado');

select lives_ok($$ update public.family_members set name = 'Lucía M.' $$, 'A puede renombrar');
select throws_ok($$ update public.family_members set user_id = 'bbbbbbbb-1313-0000-0000-000000000000' $$,
  '42501', null, 'A no puede pasar un familiar a otra cuenta');

-- --- Nadie más ve a la familia de A -----------------------------------------------
set local request.jwt.claims = '{"sub": "bbbbbbbb-1313-0000-0000-000000000000", "role": "authenticated"}';
select is((select count(*)::int from public.family_members), 0, 'B no ve a la familia de A');
select is((select count(*)::int from public.family_member_allergens), 0,
  'B no ve las alergias de la familia de A');
select throws_ok(
  $$ select public.set_family_member_allergens(
       (select id from public.family_members limit 1), array['gluten']::public.allergen[]) $$,
  '42501', null, 'B no puede cambiar las alergias de un familiar ajeno');
reset role;
select is((select count(*)::int from public.family_member_allergens), 1,
  'Las alergias de Lucía siguen intactas');
set local role authenticated;

set local request.jwt.claims = '{"sub": "dddddddd-1313-0000-0000-000000000000", "role": "authenticated"}';
select is((select count(*)::int from public.family_member_allergens), 0,
  'Un restaurante no ve datos de salud de familias');
set local request.jwt.claims = '{"sub": "eeeeeeee-1313-0000-0000-000000000000", "role": "authenticated", "aal": "aal2"}';
select is((select count(*)::int from public.family_member_allergens), 0,
  'Ni siquiera el admin ve datos de salud de familias');

reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select throws_ok($$ select * from public.family_member_allergens $$, '42501', null,
  'anon no tiene acceso');

-- --- Sin consentimiento -----------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "cccccccc-1313-0000-0000-000000000000", "role": "authenticated"}';
select throws_ok($$ select public.add_family_member('Hija', true) $$, '42501', null,
  'Sin consentimiento para datos de salud no se añaden familiares');

-- --- Premium: hasta 10 -------------------------------------------------------------
set local request.jwt.claims = '{"sub": "ffffffff-1313-0000-0000-000000000000", "role": "authenticated"}';
select is(public.family_member_limit(), 10, 'Con premium, 10 familiares');
select lives_ok($$ select public.add_family_member('Familiar ' || i, true) from generate_series(1, 10) as i $$,
  'Un premium añade 10 familiares');
select throws_ok($$ select public.add_family_member('Once', true) $$, 'SB402', null,
  'El undécimo no');

-- --- Plan: solo el admin lo cambia -----------------------------------------------
set local request.jwt.claims = '{"sub": "aaaaaaaa-1313-0000-0000-000000000000", "role": "authenticated"}';
select throws_ok($$ select public.admin_set_account_plan('a@familia.test', 'premium') $$,
  '42501', null, 'Un comensal no puede cambiar planes');

-- --- Retirar el consentimiento borra las alergias de la familia ---------------------
update public.profiles set health_data_consent_at = null
  where id = 'aaaaaaaa-1313-0000-0000-000000000000';
reset role;
select is((select count(*)::int from public.family_member_allergens a
            join public.family_members m on m.id = a.member_id
            where m.user_id = 'aaaaaaaa-1313-0000-0000-000000000000'),
  0, 'Al retirar el consentimiento se borran las alergias de toda la familia');

select * from finish();
rollback;
