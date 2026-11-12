-- Límite de 20 solicitudes de restaurantes por usuario en 24 horas.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

insert into auth.users (id, raw_user_meta_data) values
  ('aaaaaaaa-9999-0000-0000-000000000000', '{}'),
  ('bbbbbbbb-9999-0000-0000-000000000000', '{}');

-- Solicitudes antiguas de A (de hace dos días): no cuentan.
insert into public.restaurant_requests (user_id, restaurant_name, city, created_at)
select 'aaaaaaaa-9999-0000-0000-000000000000', 'Antiguo ' || i, 'Madrid', now() - interval '2 days'
from generate_series(1, 25) as i;

set local role authenticated;
set local request.jwt.claims = '{"sub": "aaaaaaaa-9999-0000-0000-000000000000", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.restaurant_requests (restaurant_name, city)
     select 'Bar ' || i, 'Madrid' from generate_series(1, 20) as i $$,
  'Un usuario puede enviar 20 solicitudes en 24 horas (las antiguas no cuentan)'
);
select throws_ok(
  $$ insert into public.restaurant_requests (restaurant_name, city) values ('Bar 21', 'Madrid') $$,
  'SB429', null,
  'La solicitud 21 en 24 horas se rechaza con SB429'
);
select is(
  (select count(*)::int from public.restaurant_requests
    where created_at > now() - interval '24 hours'),
  20, 'No se guarda ninguna solicitud de más');

-- El límite es por usuario.
set local request.jwt.claims = '{"sub": "bbbbbbbb-9999-0000-0000-000000000000", "role": "authenticated"}';
select lives_ok(
  $$ insert into public.restaurant_requests (restaurant_name, city) values ('Bar Pepe', 'Madrid') $$,
  'Otro usuario no se ve afectado'
);

reset role;
select ok(
  not has_function_privilege('authenticated', 'private.limit_restaurant_requests()', 'execute'),
  'La función del límite no se puede llamar directamente');

select * from finish();
rollback;
