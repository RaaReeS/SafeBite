-- Datos de prueba SOLO para desarrollo local (`pnpm db:reset`).
-- `supabase db push` no aplica este archivo en producción.
--
-- Cuentas (contraseña: password123):
--   restaurante@safebite.test  -> restaurant_owner, dueño de "La Huerta Demo"
--   comensal@safebite.test     -> diner, celíaco y alérgico a frutos de cáscara

-- ---------------------------------------------------------------------------
-- Usuarios
-- ---------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'restaurante@safebite.test',
   extensions.crypt('password123', extensions.gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}',
   '{"role": "restaurant_owner", "display_name": "Restaurante Demo", "accepted_terms": true}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'comensal@safebite.test',
   extensions.crypt('password123', extensions.gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}',
   '{"display_name": "Comensal Demo"}',
   now(), now(), '', '', '', '');

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
)
select gen_random_uuid(), u.id, u.id::text, 'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  now(), now(), now()
from auth.users u
where u.email in ('restaurante@safebite.test', 'comensal@safebite.test');

-- Perfil de alergias del comensal (con consentimiento).
update public.profiles set health_data_consent_at = now()
  where id = '20000000-0000-0000-0000-000000000001';

insert into public.user_allergens (user_id, allergen) values
  ('20000000-0000-0000-0000-000000000001', 'gluten'),
  ('20000000-0000-0000-0000-000000000001', 'nuts');

-- ---------------------------------------------------------------------------
-- Restaurante publicado con platos que cubren todos los resultados del filtro
-- ---------------------------------------------------------------------------
insert into public.restaurants (
  id, owner_id, name, slug, city, address, phone, latitude, longitude, published
) values (
  '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
  'La Huerta Demo', 'la-huerta-demo', 'Madrid', 'Calle Ejemplo 1', '+34 600 000 000',
  40.4168, -3.7038, true
);

-- Platos:
--   1. Ensalada: los 14 alérgenos declarados, ninguno presente  -> apto
--   2. Pan con tomate: contiene gluten                          -> no apto (celíaco)
--   3. Brownie: puede contener trazas de frutos de cáscara      -> posibles trazas
--   4. Croquetas: sin alérgenos declarados                      -> sin datos
--   5. Plato inactivo: no debe aparecer en la carta pública
insert into public.dishes (
  id, restaurant_id, name, description, price_cents, category, ingredients, sort_order, is_active
) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
   'Ensalada de la huerta', 'Lechuga, tomate, pepino y aceite de oliva.', 950, 'Entrantes',
   'Lechuga, tomate, pepino, aceite de oliva virgen extra, sal', 1, true),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001',
   'Pan con tomate', 'Pan de pueblo tostado con tomate rallado.', 450, 'Entrantes',
   'Pan de trigo, tomate, aceite de oliva, sal', 2, true),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001',
   'Brownie sin gluten', 'Brownie de chocolate elaborado sin harina de trigo.', 600, 'Postres',
   'Chocolate, azúcar, huevo, mantequilla, harina de arroz', 3, true),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001',
   'Croquetas caseras', 'Croquetas de jamón.', 800, 'Entrantes',
   null, 4, true),
  ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001',
   'Plato fuera de carta', 'Plato desactivado.', 1200, 'Principales',
   null, 5, false);

-- Ensalada: los 14 alérgenos declarados como "no contiene".
insert into public.dish_allergens (dish_id, allergen, level)
select '40000000-0000-0000-0000-000000000001', a, 'free_from'
from unnest(enum_range(null::public.allergen)) as a;

-- Pan con tomate: contiene gluten; el resto declarado como "no contiene".
insert into public.dish_allergens (dish_id, allergen, level)
select '40000000-0000-0000-0000-000000000002', a,
  case when a = 'gluten' then 'contains' else 'free_from' end::public.allergen_level
from unnest(enum_range(null::public.allergen)) as a;

-- Brownie: contiene huevo y leche, trazas de frutos de cáscara; resto "no contiene".
insert into public.dish_allergens (dish_id, allergen, level)
select '40000000-0000-0000-0000-000000000003', a,
  case
    when a in ('eggs', 'milk') then 'contains'
    when a = 'nuts' then 'may_contain'
    else 'free_from'
  end::public.allergen_level
from unnest(enum_range(null::public.allergen)) as a;

-- Croquetas: sin ningún registro en dish_allergens (= sin datos).

-- Solicitud de alta de ejemplo.
insert into public.restaurant_requests (user_id, restaurant_name, city) values
  ('20000000-0000-0000-0000-000000000001', 'Bar Pepe', 'Madrid');
