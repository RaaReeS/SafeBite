-- Importar la carta: alérgenos propuestos (ocultos al público y nunca «no contiene")
-- y límite de lecturas al día por restaurante.
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (id, raw_user_meta_data) values
  ('aaaaaaaa-1414-0000-0000-000000000000', '{"role": "restaurant_owner", "accepted_terms": true}'),
  ('bbbbbbbb-1414-0000-0000-000000000000', '{"role": "restaurant_owner", "accepted_terms": true}'),
  ('cccccccc-1414-0000-0000-000000000000', '{}');
insert into public.restaurants (id, owner_id, name, slug, city) values
  ('aaaaaaaa-1414-1111-0000-000000000000', 'aaaaaaaa-1414-0000-0000-000000000000',
   'Bar Importa', 'bar-importa', 'Madrid');
insert into public.dishes (id, restaurant_id, name) values
  ('aaaaaaaa-1414-2222-0000-000000000000', 'aaaaaaaa-1414-1111-0000-000000000000', 'Gambas');

-- Estructura.
select has_column('public', 'dishes', 'allergen_suggestions', 'dishes tiene allergen_suggestions');
select hasnt_column('public', 'public_dishes', 'allergen_suggestions',
  'La carta pública no expone los alérgenos propuestos');
select is(
  (select allergen_suggestions from public.dishes where id = 'aaaaaaaa-1414-2222-0000-000000000000'),
  '[]'::jsonb, 'Por defecto, sin propuestas');

-- La columna solo admite alérgenos oficiales con «contiene» o «puede contener».
select throws_ok($$
  update public.dishes set allergen_suggestions = '[{"allergen": "milk", "level": "free_from"}]'
  where id = 'aaaaaaaa-1414-2222-0000-000000000000' $$,
  '23514', null, 'Una propuesta nunca puede ser «no contiene»');
select throws_ok($$
  update public.dishes set allergen_suggestions = '[{"allergen": "chocolate", "level": "contains"}]'
  where id = 'aaaaaaaa-1414-2222-0000-000000000000' $$,
  '23514', null, 'Ni un alérgeno que no existe');
select throws_ok($$
  update public.dishes set allergen_suggestions = '{"allergen": "milk"}'
  where id = 'aaaaaaaa-1414-2222-0000-000000000000' $$,
  '23514', null, 'Tiene que ser una lista');

set local role authenticated;

-- El dueño guarda propuestas en su plato.
set local request.jwt.claims = '{"sub": "aaaaaaaa-1414-0000-0000-000000000000", "role": "authenticated"}';
update public.dishes
  set allergen_suggestions = '[{"allergen": "crustaceans", "level": "contains"}, {"allergen": "molluscs", "level": "may_contain"}]'
  where id = 'aaaaaaaa-1414-2222-0000-000000000000';
select is(
  (select jsonb_array_length(allergen_suggestions) from public.dishes
   where id = 'aaaaaaaa-1414-2222-0000-000000000000'),
  2, 'El dueño guarda los alérgenos propuestos de su plato');

-- Cinco lecturas al día; la sexta, SB429.
select lives_ok($$ select public.register_menu_import('aaaaaaaa-1414-1111-0000-000000000000') $$,
  'El dueño registra una lectura de su carta');
select public.register_menu_import('aaaaaaaa-1414-1111-0000-000000000000')
  from generate_series(1, 4);
select throws_ok($$ select public.register_menu_import('aaaaaaaa-1414-1111-0000-000000000000') $$,
  'SB429', null, 'La sexta lectura en 24 horas se rechaza');
select is((select count(*)::int from public.menu_imports), 5,
  'El dueño ve sus lecturas (y no se ha guardado la rechazada)');

-- Otro dueño no toca el plato ni lee la carta de un restaurante ajeno.
set local request.jwt.claims = '{"sub": "bbbbbbbb-1414-0000-0000-000000000000", "role": "authenticated"}';
update public.dishes set allergen_suggestions = '[]'
  where id = 'aaaaaaaa-1414-2222-0000-000000000000';
select throws_ok($$ select public.register_menu_import('aaaaaaaa-1414-1111-0000-000000000000') $$,
  '42501', null, 'Otro dueño no puede leer la carta de un restaurante ajeno');
select is((select count(*)::int from public.menu_imports), 0, 'ni ve sus lecturas');

-- Un comensal tampoco.
set local request.jwt.claims = '{"sub": "cccccccc-1414-0000-0000-000000000000", "role": "authenticated"}';
select throws_ok($$ select public.register_menu_import('aaaaaaaa-1414-1111-0000-000000000000') $$,
  '42501', null, 'Un comensal no puede leer cartas');

reset role;
select is(
  (select jsonb_array_length(allergen_suggestions) from public.dishes
   where id = 'aaaaaaaa-1414-2222-0000-000000000000'),
  2, 'El otro dueño no ha podido cambiar las propuestas');

select * from finish();
rollback;
