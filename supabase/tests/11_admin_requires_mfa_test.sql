-- Las funciones de administración exigen la verificación en dos pasos (aal2).
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, raw_user_meta_data) values
  ('eeeeeeee-1111-0000-0000-000000000000', '{}'),
  ('cccccccc-1111-0000-0000-000000000000', '{"role": "restaurant_owner", "accepted_terms": true}');
update public.profiles set role = 'admin' where id = 'eeeeeeee-1111-0000-0000-000000000000';
insert into public.restaurants (id, owner_id, name, slug, city) values
  ('cccccccc-1111-1111-0000-000000000000', 'cccccccc-1111-0000-0000-000000000000',
   'Bar MFA', 'bar-mfa', 'Madrid');

set local role authenticated;

-- Admin solo con contraseña (aal1) o sin el dato en la sesión.
set local request.jwt.claims = '{"sub": "eeeeeeee-1111-0000-0000-000000000000", "role": "authenticated", "aal": "aal1"}';
select throws_ok($$ select * from public.admin_list_restaurants() $$, '42501', null,
  'Con solo la contraseña (aal1), el admin no ve los restaurantes');
select throws_ok(
  $$ select public.admin_set_restaurant_verification('cccccccc-1111-1111-0000-000000000000', 'verified') $$,
  '42501', null, 'ni puede verificar');
select throws_ok($$ select * from public.admin_request_summary() $$, '42501', null,
  'ni ve las solicitudes');
select throws_ok($$ select public.admin_set_request_status('a', 'b', 'added') $$, '42501', null,
  'ni cambia su estado');

set local request.jwt.claims = '{"sub": "eeeeeeee-1111-0000-0000-000000000000", "role": "authenticated"}';
select throws_ok($$ select * from public.admin_list_restaurants() $$, '42501', null,
  'Sin nivel de autenticación en la sesión, tampoco');

-- Con el segundo paso hecho (aal2), sí.
set local request.jwt.claims = '{"sub": "eeeeeeee-1111-0000-0000-000000000000", "role": "authenticated", "aal": "aal2"}';
select lives_ok(
  $$ select public.admin_set_restaurant_verification('cccccccc-1111-1111-0000-000000000000', 'verified') $$,
  'Con la verificación en dos pasos (aal2), el admin verifica');

-- aal2 no convierte en admin a quien no lo es.
set local request.jwt.claims = '{"sub": "cccccccc-1111-0000-0000-000000000000", "role": "authenticated", "aal": "aal2"}';
select throws_ok($$ select * from public.admin_list_restaurants() $$, '42501', null,
  'Un dueño con aal2 sigue sin ser admin');

select * from finish();
rollback;
