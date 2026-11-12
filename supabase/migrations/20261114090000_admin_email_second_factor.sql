-- Segundo paso del administrador por email, como alternativa a la app de
-- autenticación (decisión del usuario; ver CLAUDE.md).
--
-- Supabase no ofrece el email como segundo factor, así que se implementa aquí:
-- - El código lo genera la BASE DE DATOS y lo envía ella misma (pg_net) a la
--   API de Brevo. Nunca se devuelve al cliente: quien solo tenga la contraseña
--   no puede leerlo.
-- - Solo se guarda su huella (bcrypt). Caduca a los 10 minutos, admite 5
--   intentos y como mucho se envían 5 códigos por hora.
-- - Al acertar, la sesión actual (claim session_id del JWT) queda verificada
--   durante 12 horas. private.require_admin() acepta aal2 (app) o esta sesión.
--
-- Configuración (Vault, nunca en el repositorio):
--   admin_email_provider = 'brevo' (producción) | 'mailpit' (local)
--   admin_email_api_key  = clave de la API de Brevo (solo producción)
--   admin_email_sender   = email remitente
--   admin_email_api_url  = solo en local (API de envío de Mailpit)

create extension if not exists pg_net;

-- ---------------------------------------------------------------------------
-- Tablas privadas (fuera de la API). RLS activado y sin políticas: solo las
-- funciones security definer de abajo las usan.
-- ---------------------------------------------------------------------------
create table private.admin_email_codes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0
);

create table private.admin_email_code_sends (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  sent_at timestamptz not null default now()
);
create index admin_email_code_sends_user_idx on private.admin_email_code_sends (user_id, sent_at);

create table private.admin_email_sessions (
  session_id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  verified_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table private.admin_email_codes enable row level security;
alter table private.admin_email_code_sends enable row level security;
alter table private.admin_email_sessions enable row level security;
revoke all on private.admin_email_codes, private.admin_email_code_sends,
  private.admin_email_sessions from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- ¿La sesión actual tiene hecho el segundo paso (app o email)?
-- ---------------------------------------------------------------------------
create function private.admin_second_factor_ok()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select private.current_user_role()) = 'admin'
    and (
      coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
      or exists (
        select 1
        from private.admin_email_sessions s
        where s.session_id = nullif((select auth.jwt() ->> 'session_id'), '')::uuid
          and s.user_id = (select auth.uid())
          and s.expires_at > now()
      )
    );
$$;

create or replace function private.require_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select private.current_user_role()) is distinct from 'admin' then
    raise exception 'solo el administrador' using errcode = '42501';
  end if;
  if not (select private.admin_second_factor_ok()) then
    raise exception 'el administrador debe completar la verificación en dos pasos'
      using errcode = '42501';
  end if;
end;
$$;

-- Para la web: saber si mostrar la administración o pedir el segundo paso.
create function public.admin_has_second_factor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select private.admin_second_factor_ok()), false);
$$;

-- ---------------------------------------------------------------------------
-- Envío del email (Brevo en producción, Mailpit en local)
-- ---------------------------------------------------------------------------
create function private.admin_email_setting(setting text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select s.decrypted_secret from vault.decrypted_secrets s where s.name = setting limit 1;
$$;

create function private.send_admin_email_code(recipient text, code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  provider text := private.admin_email_setting('admin_email_provider');
  sender text := private.admin_email_setting('admin_email_sender');
  subject text := 'Tu código de acceso a la administración de SafeBite';
  body text := format(
    'Tu código de verificación es %s. Caduca en 10 minutos. Si no has intentado entrar en la administración de SafeBite, cambia tu contraseña.',
    code);
begin
  if sender is null then
    raise exception 'el envío de códigos por email no está configurado' using errcode = 'SB503';
  end if;

  if provider = 'brevo' then
    if private.admin_email_setting('admin_email_api_key') is null then
      raise exception 'falta la clave de Brevo' using errcode = 'SB503';
    end if;
    perform net.http_post(
      url := 'https://api.brevo.com/v3/smtp/email',
      headers := jsonb_build_object(
        'api-key', private.admin_email_setting('admin_email_api_key'),
        'Content-Type', 'application/json',
        'Accept', 'application/json'),
      body := jsonb_build_object(
        'sender', jsonb_build_object('email', sender, 'name', 'SafeBite'),
        'to', jsonb_build_array(jsonb_build_object('email', recipient)),
        'subject', subject,
        'textContent', body)
    );
  elsif provider = 'mailpit' then
    perform net.http_post(
      url := private.admin_email_setting('admin_email_api_url'),
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'From', jsonb_build_object('Email', sender, 'Name', 'SafeBite'),
        'To', jsonb_build_array(jsonb_build_object('Email', recipient)),
        'Subject', subject,
        'Text', body)
    );
  else
    raise exception 'proveedor de email desconocido' using errcode = 'SB503';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Pedir un código (solo cuentas admin; la sesión puede ser aún aal1)
-- ---------------------------------------------------------------------------
create function public.admin_request_email_code()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  recipient text;
  code text;
begin
  if (select private.current_user_role()) is distinct from 'admin' then
    raise exception 'solo el administrador' using errcode = '42501';
  end if;

  if (
    select count(*) from private.admin_email_code_sends s
    where s.user_id = current_user_id and s.sent_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'demasiados códigos en una hora' using errcode = 'SB429';
  end if;

  -- 6 cifras con aleatoriedad criptográfica.
  code := lpad(
    ((('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint % 1000000))::text,
    6, '0');

  select u.email into recipient from auth.users u where u.id = current_user_id;

  insert into private.admin_email_codes (user_id, code_hash, expires_at, attempts)
  values (current_user_id, extensions.crypt(code, extensions.gen_salt('bf')),
    now() + interval '10 minutes', 0)
  on conflict (user_id) do update
    set code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0;

  insert into private.admin_email_code_sends (user_id) values (current_user_id);
  delete from private.admin_email_sessions where expires_at < now();

  perform private.send_admin_email_code(recipient, code);
end;
$$;

-- ---------------------------------------------------------------------------
-- Verificar el código. Devuelve 'ok' | 'invalid' | 'expired' | 'too_many'
-- (sin lanzar error, para que cuente el intento fallido).
-- ---------------------------------------------------------------------------
create function public.admin_verify_email_code(code text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_session uuid := nullif((select auth.jwt() ->> 'session_id'), '')::uuid;
  pending private.admin_email_codes%rowtype;
begin
  if (select private.current_user_role()) is distinct from 'admin' then
    raise exception 'solo el administrador' using errcode = '42501';
  end if;
  if current_session is null then
    raise exception 'sesión sin identificador' using errcode = '42501';
  end if;

  select * into pending from private.admin_email_codes c
  where c.user_id = current_user_id
  for update;

  if not found or pending.expires_at <= now() then
    return 'expired';
  end if;
  if pending.attempts >= 5 then
    delete from private.admin_email_codes c where c.user_id = current_user_id;
    return 'too_many';
  end if;
  if code is null or code !~ '^\d{6}$'
     or extensions.crypt(code, pending.code_hash) <> pending.code_hash then
    update private.admin_email_codes c set attempts = c.attempts + 1
    where c.user_id = current_user_id;
    return 'invalid';
  end if;

  delete from private.admin_email_codes c where c.user_id = current_user_id;
  insert into private.admin_email_sessions (session_id, user_id, expires_at)
  values (current_session, current_user_id, now() + interval '12 hours')
  on conflict (session_id) do update
    set user_id = excluded.user_id, verified_at = now(), expires_at = excluded.expires_at;
  return 'ok';
end;
$$;

revoke all on function private.admin_second_factor_ok() from public, anon, authenticated;
revoke all on function private.admin_email_setting(text) from public, anon, authenticated;
revoke all on function private.send_admin_email_code(text, text) from public, anon, authenticated;
revoke all on function public.admin_has_second_factor() from public, anon, authenticated;
revoke all on function public.admin_request_email_code() from public, anon, authenticated;
revoke all on function public.admin_verify_email_code(text) from public, anon, authenticated;
grant execute on function public.admin_has_second_factor() to authenticated;
grant execute on function public.admin_request_email_code() to authenticated;
grant execute on function public.admin_verify_email_code(text) to authenticated;
