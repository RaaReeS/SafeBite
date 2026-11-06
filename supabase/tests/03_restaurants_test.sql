-- Restaurantes, platos y alérgenos: cada restaurante solo gestiona su carta.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

-- X e Y dueños de restaurante, D comensal.
insert into auth.users (id, raw_user_meta_data) values
  ('11111111-0000-0000-0000-000000000000', '{"role": "restaurant_owner"}'),
  ('22222222-0000-0000-0000-000000000000', '{"role": "restaurant_owner"}'),
  ('dddddddd-0000-0000-0000-000000000000', '{}');

-- Restaurante y plato de Y, creados como superusuario.
insert into public.restaurants (id, owner_id, name, slug, city) values
  ('99999999-0000-0000-0000-000000000000', '22222222-0000-0000-0000-000000000000',
   'Casa Y', 'casa-y', 'Madrid');
insert into public.dishes (id, restaurant_id, name) values
  ('99999999-1111-0000-0000-000000000000', '99999999-0000-0000-0000-000000000000', 'Plato Y');
insert into public.dish_allergens (dish_id, allergen, level) values
  ('99999999-1111-0000-0000-000000000000', 'gluten', 'contains');

-- --- Comensal D -------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "dddddddd-0000-0000-0000-000000000000", "role": "authenticated"}';

select throws_ok(
  $$ insert into public.restaurants (name, slug, city) values ('Falso', 'falso', 'Madrid') $$,
  '42501', null,
  'Un comensal no puede crear restaurantes'
);

select lives_ok(
  $$ insert into public.restaurant_requests (restaurant_name, city) values ('Bar Pepe', 'Madrid') $$,
  'Un comensal puede pedir el alta de un restaurante'
);

select is(
  (select user_id from public.restaurant_requests),
  'dddddddd-0000-0000-0000-000000000000'::uuid,
  'La solicitud queda asociada a quien la crea'
);

-- --- Dueño X ----------------------------------------------------------------
set local request.jwt.claims = '{"sub": "11111111-0000-0000-0000-000000000000", "role": "authenticated"}';

select is(
  (select count(*)::int from public.restaurant_requests), 0,
  'X no ve las solicitudes de otros usuarios'
);

select lives_ok(
  $$ insert into public.restaurants (name, slug, city) values ('Casa X', 'casa-x', 'Madrid') $$,
  'Un dueño puede crear su restaurante'
);

select is(
  (select owner_id from public.restaurants where slug = 'casa-x'),
  '11111111-0000-0000-0000-000000000000'::uuid,
  'owner_id se asigna automáticamente al usuario que crea el restaurante'
);

select throws_ok(
  $$ insert into public.restaurants (owner_id, name, slug, city) values
     ('22222222-0000-0000-0000-000000000000', 'Suplantado', 'suplantado', 'Madrid') $$,
  '42501', null,
  'X no puede crear un restaurante a nombre de otro'
);

select throws_ok(
  $$ update public.restaurants set owner_id = '22222222-0000-0000-0000-000000000000'
     where slug = 'casa-x' $$,
  '42501', null,
  'X no puede transferir su restaurante'
);

select is(
  (select count(*)::int from public.restaurants), 1,
  'X solo ve sus restaurantes en la tabla base'
);

select lives_ok(
  $$ insert into public.dishes (restaurant_id, name)
     select id, 'Plato X' from public.restaurants where slug = 'casa-x' $$,
  'X puede crear platos en su restaurante'
);

select lives_ok(
  $$ insert into public.dish_allergens (dish_id, allergen, level)
     select id, 'milk', 'may_contain' from public.dishes where name = 'Plato X' $$,
  'X puede declarar alérgenos en sus platos'
);

select throws_ok(
  $$ insert into public.dishes (restaurant_id, name) values
     ('99999999-0000-0000-0000-000000000000', 'Intruso') $$,
  '42501', null,
  'X no puede crear platos en el restaurante de Y'
);

select throws_ok(
  $$ insert into public.dish_allergens (dish_id, allergen, level) values
     ('99999999-1111-0000-0000-000000000000', 'gluten', 'free_from') $$,
  '42501', null,
  'X no puede declarar alérgenos en platos de Y'
);

select throws_ok(
  $$ update public.dishes set restaurant_id = '99999999-0000-0000-0000-000000000000'
     where name = 'Plato X' $$,
  '42501', null,
  'X no puede mover sus platos al restaurante de Y'
);

-- Intentos silenciosos sobre datos de Y (RLS los filtra: afectan a 0 filas).
update public.restaurants set name = 'Hackeado' where id = '99999999-0000-0000-0000-000000000000';
update public.dishes set name = 'Hackeado' where id = '99999999-1111-0000-0000-000000000000';
update public.dish_allergens set level = 'free_from'
  where dish_id = '99999999-1111-0000-0000-000000000000';
delete from public.dish_allergens where dish_id = '99999999-1111-0000-0000-000000000000';
delete from public.dishes where id = '99999999-1111-0000-0000-000000000000';
delete from public.restaurants where id = '99999999-0000-0000-0000-000000000000';

select is(
  (select count(*)::int from public.dishes), 1,
  'X solo ve sus platos en la tabla base'
);

-- --- Comprobaciones como superusuario ---------------------------------------
reset role;

select is(
  (select name from public.restaurants where id = '99999999-0000-0000-0000-000000000000'),
  'Casa Y',
  'X no pudo editar ni borrar el restaurante de Y'
);
select is(
  (select name from public.dishes where id = '99999999-1111-0000-0000-000000000000'),
  'Plato Y',
  'X no pudo editar ni borrar platos de Y'
);
select is(
  (select level from public.dish_allergens
   where dish_id = '99999999-1111-0000-0000-000000000000' and allergen = 'gluten'),
  'contains'::public.allergen_level,
  'X no pudo cambiar ni borrar alérgenos de Y'
);

-- --- Dueño Y: puede editar lo suyo ------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-0000-0000-0000-000000000000", "role": "authenticated"}';

select lives_ok(
  $$ update public.dish_allergens set level = 'may_contain'
     where dish_id = '99999999-1111-0000-0000-000000000000' and allergen = 'gluten' $$,
  'Y puede editar los alérgenos de sus platos'
);

select is(
  (select level from public.dish_allergens
   where dish_id = '99999999-1111-0000-0000-000000000000' and allergen = 'gluten'),
  'may_contain'::public.allergen_level,
  'El cambio de Y se guarda'
);

select * from finish();
rollback;
