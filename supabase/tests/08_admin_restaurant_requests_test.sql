-- Solicitudes de restaurantes: solo el administrador ve el resumen y cambia
-- estados, y el resumen nunca revela quién hizo cada solicitud.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

-- A y B comensales, O dueño, X administrador.
insert into auth.users (id, raw_user_meta_data) values
  ('aaaaaaaa-8888-0000-0000-000000000000', '{}'),
  ('bbbbbbbb-8888-0000-0000-000000000000', '{}'),
  ('cccccccc-8888-0000-0000-000000000000', '{"role": "restaurant_owner", "accepted_terms": true}'),
  ('dddddddd-8888-0000-0000-000000000000', '{"role": "admin"}');
update public.profiles set role = 'admin' where id = 'dddddddd-8888-0000-0000-000000000000';

-- Partimos sin solicitudes (el seed puede tener algunas).
delete from public.restaurant_requests;

select is(
  (select role::text from public.profiles where id = 'dddddddd-8888-0000-0000-000000000000'),
  'admin', 'El rol admin solo se asigna desde la base de datos');

-- --- Comensales: crean solicitudes ------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "aaaaaaaa-8888-0000-0000-000000000000", "role": "authenticated"}';
insert into public.restaurant_requests (restaurant_name, city) values
  ('Bar Pepe', 'Madrid'),
  ('Casa Lola', 'Zaragoza');

select throws_ok(
  $$ insert into public.restaurant_requests (restaurant_name, city, status)
     values ('Otro', 'Madrid', 'added') $$,
  '42501', null,
  'Un comensal no puede elegir el estado al crear una solicitud'
);
select is(
  (select count(*)::int from public.restaurant_requests where status = 'pending'),
  2, 'Las solicitudes nacen pendientes');

set local request.jwt.claims = '{"sub": "bbbbbbbb-8888-0000-0000-000000000000", "role": "authenticated"}';
insert into public.restaurant_requests (restaurant_name, city) values
  ('  bar  PÉPE ', 'madrid');

-- En una transacción now() no cambia: se envejecen las de A para que la de B
-- sea la más reciente (el resumen muestra la forma escrita más reciente).
reset role;
update public.restaurant_requests set created_at = now() - interval '1 day'
  where user_id = 'aaaaaaaa-8888-0000-0000-000000000000';
set local role authenticated;

select is(
  (select count(*)::int from public.restaurant_requests),
  1, 'B solo ve su propia solicitud');
select throws_ok(
  $$ update public.restaurant_requests set status = 'added' $$,
  '42501', null,
  'Un comensal no puede cambiar el estado de las solicitudes'
);
select throws_ok(
  $$ select * from public.admin_request_summary() $$,
  '42501', null,
  'Un comensal no puede ver el resumen'
);
select throws_ok(
  $$ select public.admin_set_request_status('bar pepe', 'madrid', 'added') $$,
  '42501', null,
  'Un comensal no puede cambiar estados con la función'
);

-- --- Dueño de restaurante -----------------------------------------------------
set local request.jwt.claims = '{"sub": "cccccccc-8888-0000-0000-000000000000", "role": "authenticated"}';
select is(
  (select count(*)::int from public.restaurant_requests),
  0, 'Un dueño no ve las solicitudes de los comensales');
select throws_ok(
  $$ select * from public.admin_request_summary() $$,
  '42501', null,
  'Un dueño no puede ver el resumen'
);

-- --- Anónimo --------------------------------------------------------------------
reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select throws_ok(
  $$ select * from public.admin_request_summary() $$,
  '42501', null,
  'anon no puede ejecutar el resumen'
);
select throws_ok(
  $$ select public.admin_set_request_status('bar pepe', 'madrid', 'added') $$,
  '42501', null,
  'anon no puede cambiar estados'
);

-- --- Administrador ----------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "dddddddd-8888-0000-0000-000000000000", "role": "authenticated"}';

select is(
  (select count(*)::int from public.restaurant_requests),
  0, 'Ni siquiera el admin lee la tabla directamente (con sus user_id)');

select results_eq(
  $$ select restaurant_name, city, name_key, city_key, request_count, pending_count, status::text
     from public.admin_request_summary() $$,
  $$ values
       ('  bar  PÉPE '::text, 'madrid'::text, 'bar pepe'::text, 'madrid'::text, 2, 2, 'pending'::text),
       ('Casa Lola', 'Zaragoza', 'casa lola', 'zaragoza', 1, 1, 'pending') $$,
  'Agrupa sin distinguir mayúsculas, tildes ni espacios y ordena por número de peticiones'
);
select ok(
  not exists (
    select 1 from pg_proc p, unnest(p.proargnames) as arg
    where p.proname = 'admin_request_summary' and arg ilike '%user%'
  ),
  'El resumen no tiene ninguna columna con el usuario');

select is(
  public.admin_set_request_status('bar pepe', 'madrid', 'added'),
  2, 'Marcar como añadido cambia todas las solicitudes del grupo');
select is(
  public.admin_set_request_status('bar pepe', 'madrid', 'added'),
  0, 'Repetirlo no cambia nada más');
select results_eq(
  $$ select name_key, status::text from public.admin_request_summary() $$,
  $$ values ('casa lola'::text, 'pending'::text), ('bar pepe', 'added') $$,
  'Los grupos pendientes aparecen primero'
);
select throws_ok(
  $$ select public.admin_set_request_status(null, 'madrid', 'added') $$,
  '22023', null,
  'Sin grupo no se cambia nada'
);

-- Si alguien vuelve a pedirlo, el grupo vuelve a estar pendiente.
set local request.jwt.claims = '{"sub": "aaaaaaaa-8888-0000-0000-000000000000", "role": "authenticated"}';
insert into public.restaurant_requests (restaurant_name, city) values ('Bar Pepe', 'Madrid');
set local request.jwt.claims = '{"sub": "dddddddd-8888-0000-0000-000000000000", "role": "authenticated"}';
select results_eq(
  $$ select request_count, pending_count, status::text
     from public.admin_request_summary() where name_key = 'bar pepe' $$,
  $$ values (3, 1, 'pending'::text) $$,
  'Una petición nueva de un restaurante ya añadido vuelve a ponerlo pendiente'
);
select is(
  public.admin_set_request_status('casa lola', 'zaragoza', 'added'),
  1, 'El admin puede marcar otro grupo');

select * from finish();
rollback;
