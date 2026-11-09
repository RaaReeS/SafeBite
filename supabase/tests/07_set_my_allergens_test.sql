-- set_my_allergens(): guardado atómico del perfil de alergias (datos de salud).
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (id, raw_user_meta_data) values
  ('aaaaaaaa-7777-0000-0000-000000000000', '{}'),
  ('bbbbbbbb-7777-0000-0000-000000000000', '{}'),
  ('cccccccc-7777-0000-0000-000000000000', '{}');

-- A y B dan su consentimiento; C no.
update public.profiles set health_data_consent_at = now()
  where id in ('aaaaaaaa-7777-0000-0000-000000000000', 'bbbbbbbb-7777-0000-0000-000000000000');
insert into public.user_allergens (user_id, allergen) values
  ('bbbbbbbb-7777-0000-0000-000000000000', 'fish');

-- --- Usuario A ----------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "aaaaaaaa-7777-0000-0000-000000000000", "role": "authenticated"}';

select lives_ok(
  $$ select public.set_my_allergens(array['gluten', 'milk']::public.allergen[]) $$,
  'A guarda su perfil de alergias'
);
select results_eq(
  $$ select allergen::text from public.user_allergens order by 1 $$,
  $$ values ('gluten'), ('milk') $$,
  'Se guardan exactamente las alergias enviadas'
);

select lives_ok(
  $$ select public.set_my_allergens(array['eggs', 'eggs', 'sesame']::public.allergen[]) $$,
  'Los duplicados no dan error'
);
select results_eq(
  $$ select allergen::text from public.user_allergens order by 1 $$,
  $$ values ('eggs'), ('sesame') $$,
  'Un nuevo guardado sustituye por completo al anterior (y sin duplicados)'
);

select throws_ok(
  $$ select public.set_my_allergens(null) $$, '22023', null,
  'null no borra el perfil'
);
select is((select count(*)::int from public.user_allergens), 2,
  'Tras un guardado fallido el perfil sigue intacto');

select throws_ok(
  $$ select public.set_my_allergens(array['lactose']::public.allergen[]) $$, '22P02', null,
  'Un alérgeno inexistente hace fallar el guardado'
);
select is((select count(*)::int from public.user_allergens), 2,
  'Tras un alérgeno inexistente el perfil sigue intacto');

select lives_ok(
  $$ select public.set_my_allergens(array[]::public.allergen[]) $$,
  'Un perfil vacío es válido'
);
select is((select count(*)::int from public.user_allergens), 0,
  'El perfil vacío borra todas las alergias de A');

-- --- Usuario C (sin consentimiento) ---------------------------------------------
set local request.jwt.claims = '{"sub": "cccccccc-7777-0000-0000-000000000000", "role": "authenticated"}';
select throws_ok(
  $$ select public.set_my_allergens(array['gluten']::public.allergen[]) $$, '42501', null,
  'Sin consentimiento no se pueden guardar alergias'
);

-- --- Anónimo ------------------------------------------------------------------
reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select throws_ok(
  $$ select public.set_my_allergens(array['gluten']::public.allergen[]) $$, '42501', null,
  'anon no puede ejecutar set_my_allergens'
);

-- --- Comprobación como superusuario ---------------------------------------------
reset role;
select results_eq(
  $$ select allergen::text from public.user_allergens
     where user_id = 'bbbbbbbb-7777-0000-0000-000000000000' $$,
  $$ values ('fish') $$,
  'Las alergias de B no se han tocado'
);

select * from finish();
rollback;
