-- Segundo paso del administrador por email.
begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

insert into auth.users (id, email, raw_user_meta_data) values
  ('eeeeeeee-1212-0000-0000-000000000000', 'admin@email.test', '{}'),
  ('cccccccc-1212-0000-0000-000000000000', 'dueno@email.test',
   '{"role": "restaurant_owner", "accepted_terms": true}');
update public.profiles set role = 'admin' where id = 'eeeeeeee-1212-0000-0000-000000000000';

-- --- Nadie lee las tablas ni el envío directamente ------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "eeeeeeee-1212-0000-0000-000000000000", "role": "authenticated", "aal": "aal1", "session_id": "11111111-1212-0000-0000-000000000000"}';
select throws_ok($$ select * from private.admin_email_codes $$, '42501', null,
  'El admin no puede leer los códigos guardados');
select throws_ok($$ select * from private.admin_email_sessions $$, '42501', null,
  'ni las sesiones verificadas');
select throws_ok($$ select private.send_admin_email_code('x@y.z', '123456') $$, '42501', null,
  'ni enviar emails por su cuenta');

-- --- Pedir un código ---------------------------------------------------------------
select is(public.admin_has_second_factor(), false, 'Con solo la contraseña, sin segundo paso');
select throws_ok($$ select * from public.admin_list_restaurants() $$, '42501', null,
  'y sin acceso a la administración');

select lives_ok($$ select public.admin_request_email_code() $$, 'El admin puede pedir un código');

reset role;
select is((select count(*)::int from private.admin_email_codes
    where user_id = 'eeeeeeee-1212-0000-0000-000000000000'), 1, 'Se guarda un código pendiente');
select ok((select code_hash !~ '^\d{6}$' from private.admin_email_codes
    where user_id = 'eeeeeeee-1212-0000-0000-000000000000'), 'Solo se guarda la huella, no el código');
select is((select count(*)::int from net.http_request_queue
    where convert_from(body, 'UTF8') like '%admin@email.test%'), 1, 'Se encola el envío al email de la cuenta');

-- Fijamos un código conocido para poder probar la verificación.
update private.admin_email_codes set code_hash = extensions.crypt('482913', extensions.gen_salt('bf'))
  where user_id = 'eeeeeeee-1212-0000-0000-000000000000';

-- --- Verificar ---------------------------------------------------------------------
set local role authenticated;
select is(public.admin_verify_email_code('000000'), 'invalid', 'Un código incorrecto no vale');
select is(public.admin_verify_email_code('abc'), 'invalid', 'ni uno con otro formato');
reset role;
select is((select attempts from private.admin_email_codes
    where user_id = 'eeeeeeee-1212-0000-0000-000000000000'), 2, 'Los intentos fallidos cuentan');
set local role authenticated;

select is(public.admin_verify_email_code('482913'), 'ok', 'El código correcto vale');
select is(public.admin_has_second_factor(), true, 'La sesión queda verificada');
select lives_ok($$ select * from public.admin_list_restaurants() $$,
  'y el admin accede a la administración');
select is(public.admin_verify_email_code('482913'), 'expired', 'El código no se puede reutilizar');

-- Otra sesión (otro dispositivo) del mismo admin no queda verificada.
set local request.jwt.claims = '{"sub": "eeeeeeee-1212-0000-0000-000000000000", "role": "authenticated", "aal": "aal1", "session_id": "22222222-1212-0000-0000-000000000000"}';
select is(public.admin_has_second_factor(), false, 'La verificación es solo para esa sesión');

-- --- Límites ---------------------------------------------------------------------------
reset role;
insert into private.admin_email_codes (user_id, code_hash, expires_at, attempts)
values ('eeeeeeee-1212-0000-0000-000000000000', extensions.crypt('111111', extensions.gen_salt('bf')),
  now() + interval '10 minutes', 5)
on conflict (user_id) do update set code_hash = excluded.code_hash, attempts = 5,
  expires_at = excluded.expires_at;
set local role authenticated;
select is(public.admin_verify_email_code('111111'), 'too_many',
  'Tras 5 intentos fallidos el código se anula, aunque ahora se acierte');

reset role;
update private.admin_email_codes set expires_at = now() - interval '1 second'
  where user_id = 'eeeeeeee-1212-0000-0000-000000000000';
insert into private.admin_email_codes (user_id, code_hash, expires_at)
values ('eeeeeeee-1212-0000-0000-000000000000', extensions.crypt('222222', extensions.gen_salt('bf')),
  now() - interval '1 second')
on conflict (user_id) do update set code_hash = excluded.code_hash, attempts = 0,
  expires_at = excluded.expires_at;
set local role authenticated;
select is(public.admin_verify_email_code('222222'), 'expired', 'Un código caducado no vale');

-- Como mucho 5 envíos por hora (ya se ha enviado 1).
select lives_ok($$ select public.admin_request_email_code() from generate_series(1, 4) $$,
  'Hasta 5 códigos por hora');
select throws_ok($$ select public.admin_request_email_code() $$, 'SB429', null,
  'El sexto en una hora se rechaza');

-- Quien no es admin no puede pedir ni verificar códigos.
set local request.jwt.claims = '{"sub": "cccccccc-1212-0000-0000-000000000000", "role": "authenticated", "session_id": "33333333-1212-0000-0000-000000000000"}';
select throws_ok($$ select public.admin_request_email_code() $$, '42501', null,
  'Un dueño no puede pedir códigos de administrador');
select throws_ok($$ select public.admin_verify_email_code('123456') $$, '42501', null,
  'ni verificarlos');

select * from finish();
rollback;
