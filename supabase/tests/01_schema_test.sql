-- Comprobaciones estructurales de seguridad.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

select is(
  (select count(*)::int
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  0,
  'Todas las tablas de public tienen RLS activado'
);

select is(
  (select count(*)::int
   from information_schema.role_table_grants g
   join pg_class c on c.relname = g.table_name
   join pg_namespace n on n.oid = c.relnamespace and n.nspname = g.table_schema
   where g.table_schema = 'public' and g.grantee = 'anon' and c.relkind = 'r'),
  0,
  'anon no tiene ningún permiso sobre las tablas base'
);

select is(
  (select count(*)::int
   from information_schema.role_table_grants
   where table_schema = 'public' and grantee = 'anon' and privilege_type <> 'SELECT'),
  0,
  'anon solo tiene permisos de lectura (en las vistas públicas)'
);

select hasnt_column('public', 'public_restaurants', 'owner_id',
  'La vista pública de restaurantes no expone owner_id');
select hasnt_column('public', 'public_restaurants', 'published',
  'La vista pública de restaurantes no expone campos internos');

select is(
  (select count(*)::int from information_schema.column_privileges
   where table_schema = 'public' and table_name = 'profiles'
     and column_name = 'role' and grantee = 'authenticated' and privilege_type = 'UPDATE'),
  0,
  'authenticated no puede actualizar la columna role'
);

select is(
  (select count(*)::int from information_schema.column_privileges
   where table_schema = 'public' and table_name = 'restaurants'
     and column_name = 'owner_id' and grantee = 'authenticated'
     and privilege_type in ('INSERT', 'UPDATE')),
  0,
  'authenticated no puede escribir owner_id'
);

select is(
  (select count(*)::int from information_schema.usage_privileges
   where object_schema = 'private' and grantee = 'anon'),
  0,
  'anon no tiene acceso al esquema private'
);

select * from finish();
rollback;
