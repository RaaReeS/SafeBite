-- Términos de uso y guardado atómico de alérgenos (set_dish_allergens).
begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

-- X dueño con términos, S dueño sin términos, Y otro dueño, D comensal.
insert into auth.users (id, raw_user_meta_data) values
  ('11111111-0000-0000-0000-000000000000', '{"role": "restaurant_owner", "accepted_terms": true}'),
  ('55555555-0000-0000-0000-000000000000', '{"role": "restaurant_owner"}'),
  ('66666666-0000-0000-0000-000000000000', '{"role": "restaurant_owner", "accepted_terms": "true"}'),
  ('22222222-0000-0000-0000-000000000000', '{"role": "restaurant_owner", "accepted_terms": true}'),
  ('dddddddd-0000-0000-0000-000000000000', '{}');

-- --- Términos ---------------------------------------------------------------
select isnt(
  (select terms_accepted_at from public.profiles where id = '11111111-0000-0000-0000-000000000000'),
  null,
  'accepted_terms = true en el registro guarda la fecha de aceptación'
);
select is(
  (select terms_accepted_at from public.profiles where id = '55555555-0000-0000-0000-000000000000'),
  null,
  'Sin accepted_terms no se registra aceptación'
);
select is(
  (select terms_accepted_at from public.profiles where id = '66666666-0000-0000-0000-000000000000'),
  null,
  'Solo el booleano true cuenta como aceptación (no el texto "true")'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "55555555-0000-0000-0000-000000000000", "role": "authenticated"}';

select throws_ok(
  $$ insert into public.restaurants (name, slug, city) values ('Sin términos', 'sin-terminos', 'Madrid') $$,
  '42501', null,
  'Un dueño que no ha aceptado los términos no puede crear restaurantes'
);
select throws_ok(
  $$ update public.profiles set terms_accepted_at = now()
     where id = '55555555-0000-0000-0000-000000000000' $$,
  '42501', null,
  'El usuario no puede marcar los términos como aceptados por su cuenta'
);

-- --- set_dish_allergens: preparación ----------------------------------------
reset role;
insert into public.restaurants (id, owner_id, name, slug, city) values
  ('aaaa0000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000000',
   'Casa X', 'casa-x', 'Madrid');
insert into public.dishes (id, restaurant_id, name) values
  ('aaaa0000-1111-0000-0000-000000000000', 'aaaa0000-0000-0000-0000-000000000000', 'Plato X');

create temporary table snapshot (allergen public.allergen, level public.allergen_level);
grant all on snapshot to authenticated, anon;

-- --- Dueño X ----------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-0000-0000-0000-000000000000", "role": "authenticated"}';

select lives_ok(
  $$ select public.set_dish_allergens('aaaa0000-1111-0000-0000-000000000000', '[
       {"allergen": "gluten", "level": "contains"},
       {"allergen": "milk", "level": "may_contain"},
       {"allergen": "eggs", "level": "free_from"}
     ]') $$,
  'X puede declarar los alérgenos de su plato'
);
select results_eq(
  $$ select allergen::text, level::text from public.dish_allergens
     where dish_id = 'aaaa0000-1111-0000-0000-000000000000' order by dish_allergens.allergen $$,
  $$ values ('gluten', 'contains'), ('eggs', 'free_from'), ('milk', 'may_contain') $$,
  'Se guardan exactamente las declaraciones enviadas'
);

select lives_ok(
  $$ select public.set_dish_allergens('aaaa0000-1111-0000-0000-000000000000', '[
       {"allergen": "milk", "level": "contains"}
     ]') $$,
  'X puede volver a guardar'
);
select results_eq(
  $$ select allergen::text, level::text from public.dish_allergens where dish_id = 'aaaa0000-1111-0000-0000-000000000000' $$,
  $$ values ('milk', 'contains') $$,
  'El nuevo guardado sustituye por completo al anterior (lo no enviado queda sin declarar)'
);

-- Fallos: nada debe cambiar respecto al último guardado válido.
insert into snapshot select allergen, level from public.dish_allergens where dish_id = 'aaaa0000-1111-0000-0000-000000000000';

select throws_ok(
  $$ select public.set_dish_allergens('aaaa0000-1111-0000-0000-000000000000', '[
       {"allergen": "gluten", "level": "free_from"},
       {"allergen": "fish", "level": "none"}
     ]') $$,
  '22P02', null,
  'Un nivel inválido hace fallar el guardado'
);
select results_eq(
  $$ select allergen, level from public.dish_allergens where dish_id = 'aaaa0000-1111-0000-0000-000000000000' $$,
  $$ select allergen, level from snapshot $$,
  'Tras un nivel inválido no se ha borrado ni guardado nada'
);

select throws_ok(
  $$ select public.set_dish_allergens('aaaa0000-1111-0000-0000-000000000000', '[
       {"allergen": "lactose", "level": "contains"}
     ]') $$,
  '22P02', null,
  'Un alérgeno inexistente hace fallar el guardado'
);

select throws_ok(
  $$ select public.set_dish_allergens('aaaa0000-1111-0000-0000-000000000000', '[
       {"allergen": "gluten", "level": "contains"},
       {"allergen": "gluten", "level": "free_from"}
     ]') $$,
  '23505', null,
  'Un alérgeno repetido hace fallar el guardado'
);

select throws_ok(
  $$ select public.set_dish_allergens('aaaa0000-1111-0000-0000-000000000000', '[
       {"allergen": "gluten"}
     ]') $$,
  '23502', null,
  'Una declaración sin nivel hace fallar el guardado'
);

select throws_ok(
  $$ select public.set_dish_allergens('aaaa0000-1111-0000-0000-000000000000',
       '{"allergen": "gluten", "level": "contains"}') $$,
  '22023', null,
  'Un JSON que no es un array hace fallar el guardado'
);

select throws_ok(
  $$ select public.set_dish_allergens('aaaa0000-1111-0000-0000-000000000000', null) $$,
  '22023', null,
  'null hace fallar el guardado (no borra las declaraciones)'
);

select results_eq(
  $$ select allergen, level from public.dish_allergens where dish_id = 'aaaa0000-1111-0000-0000-000000000000' $$,
  $$ select allergen, level from snapshot $$,
  'Ningún guardado fallido ha modificado las declaraciones'
);

select lives_ok(
  $$ select public.set_dish_allergens('aaaa0000-1111-0000-0000-000000000000', '[]') $$,
  'Un array vacío es válido'
);
select is(
  (select count(*)::int from public.dish_allergens where dish_id = 'aaaa0000-1111-0000-0000-000000000000'), 0,
  'Un array vacío deja todos los alérgenos sin declarar'
);

-- Volvemos a un estado conocido para las pruebas de otros usuarios.
select public.set_dish_allergens('aaaa0000-1111-0000-0000-000000000000',
  '[{"allergen": "gluten", "level": "contains"}]');

-- --- Otro dueño Y -----------------------------------------------------------
set local request.jwt.claims = '{"sub": "22222222-0000-0000-0000-000000000000", "role": "authenticated"}';

select throws_ok(
  $$ select public.set_dish_allergens('aaaa0000-1111-0000-0000-000000000000',
       '[{"allergen": "gluten", "level": "free_from"}]') $$,
  '42501', null,
  'Y no puede declarar alérgenos en platos de X'
);

-- --- Comensal D -------------------------------------------------------------
set local request.jwt.claims = '{"sub": "dddddddd-0000-0000-0000-000000000000", "role": "authenticated"}';

select throws_ok(
  $$ select public.set_dish_allergens('aaaa0000-1111-0000-0000-000000000000', '[]') $$,
  '42501', null,
  'Un comensal no puede declarar alérgenos'
);

-- --- Anónimo ----------------------------------------------------------------
reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select throws_ok(
  $$ select public.set_dish_allergens('aaaa0000-1111-0000-0000-000000000000', '[]') $$,
  '42501', null,
  'anon no puede ejecutar set_dish_allergens'
);

-- --- Comprobación final como superusuario -----------------------------------
reset role;

select results_eq(
  $$ select allergen::text, level::text from public.dish_allergens where dish_id = 'aaaa0000-1111-0000-0000-000000000000' $$,
  $$ values ('gluten', 'contains') $$,
  'Los intentos de Y, del comensal y de anon no han cambiado nada'
);

select * from finish();
rollback;
