-- Tablas, índices y triggers.
--
-- RLS se activa en cada tabla nada más crearla: sin políticas, nadie (salvo
-- service_role) puede leer ni escribir. Las políticas y los permisos por
-- columna se definen en la migración siguiente.

-- Esquema privado para funciones auxiliares. No se expone por la API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: uno por usuario de auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'diner',
  display_name text check (char_length(display_name) <= 100),
  -- Consentimiento explícito para tratar datos de salud (RGPD, art. 9).
  -- Sin consentimiento no se pueden guardar alergias.
  health_data_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- user_allergens: perfil de alergias (dato de salud)
-- ---------------------------------------------------------------------------
create table public.user_allergens (
  user_id uuid not null references public.profiles (id) on delete cascade,
  allergen public.allergen not null,
  created_at timestamptz not null default now(),
  primary key (user_id, allergen)
);
alter table public.user_allergens enable row level security;

-- ---------------------------------------------------------------------------
-- restaurants
-- ---------------------------------------------------------------------------
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique
    check (char_length(slug) between 3 and 80 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  city text not null check (char_length(city) between 1 and 100),
  address text check (char_length(address) <= 200),
  phone text check (char_length(phone) <= 30),
  contact_email text check (char_length(contact_email) <= 254),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  -- Una carta no es visible públicamente hasta que el restaurante la publica.
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((latitude is null) = (longitude is null))
);
alter table public.restaurants enable row level security;

create index restaurants_owner_id_idx on public.restaurants (owner_id);
create index restaurants_city_published_idx on public.restaurants (lower(city)) where published;

create trigger restaurants_set_updated_at
  before update on public.restaurants
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- dishes
-- ---------------------------------------------------------------------------
create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text check (char_length(description) <= 1000),
  -- Precio en céntimos para evitar errores de redondeo.
  price_cents integer check (price_cents >= 0),
  category text check (char_length(category) <= 60),
  ingredients text check (char_length(ingredients) <= 2000),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.dishes enable row level security;

create index dishes_restaurant_id_idx on public.dishes (restaurant_id, sort_order);

create trigger dishes_set_updated_at
  before update on public.dishes
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- dish_allergens: un registro por alérgeno declarado.
-- Alérgeno sin registro = "sin datos" (nunca se asume que no lo contiene).
-- ---------------------------------------------------------------------------
create table public.dish_allergens (
  dish_id uuid not null references public.dishes (id) on delete cascade,
  allergen public.allergen not null,
  level public.allergen_level not null,
  updated_at timestamptz not null default now(),
  primary key (dish_id, allergen)
);
alter table public.dish_allergens enable row level security;

create trigger dish_allergens_set_updated_at
  before update on public.dish_allergens
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- restaurant_requests: "Pide este restaurante"
-- ---------------------------------------------------------------------------
create table public.restaurant_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  restaurant_name text not null check (char_length(restaurant_name) between 1 and 120),
  city text not null check (char_length(city) between 1 and 100),
  created_at timestamptz not null default now()
);
alter table public.restaurant_requests enable row level security;

create index restaurant_requests_user_id_idx on public.restaurant_requests (user_id);

-- ---------------------------------------------------------------------------
-- Alta automática del perfil al registrarse.
-- El rol viene de los metadatos del registro, pero solo se aceptan 'diner' y
-- 'restaurant_owner'. 'admin' nunca se asigna desde el cliente.
-- ---------------------------------------------------------------------------
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    case
      when requested_role = 'restaurant_owner' then 'restaurant_owner'::public.user_role
      else 'diner'::public.user_role
    end,
    left(new.raw_user_meta_data ->> 'display_name', 100)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Retirada del consentimiento: se borran las alergias guardadas (RGPD).
-- ---------------------------------------------------------------------------
create function private.handle_health_consent_withdrawn()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.user_allergens where user_id = new.id;
  return new;
end;
$$;

create trigger profiles_health_consent_withdrawn
  after update of health_data_consent_at on public.profiles
  for each row
  when (old.health_data_consent_at is not null and new.health_data_consent_at is null)
  execute function private.handle_health_consent_withdrawn();
