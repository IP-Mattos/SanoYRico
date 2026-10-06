-- Read-only audit queries. Run each in the Supabase SQL editor and paste the results back.

-- 1) RLS policies
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public' order by tablename, policyname;

-- 2) Tables/views and whether RLS is enabled
select c.relname, c.relkind, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced,
       c.reloptions
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'v', 'm') order by c.relname;

-- 3) View definitions
select viewname, definition from pg_views where schemaname = 'public' order by viewname;

-- 4) Columns
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns where table_schema = 'public' order by table_name, ordinal_position;

-- 5) Table grants
select table_name, grantee, privilege_type
from information_schema.role_table_grants where table_schema = 'public' order by table_name, grantee, privilege_type;

-- 6) Functions (definitions, security mode, config)
select p.proname, pg_get_function_identity_arguments(p.oid) as args, p.prosecdef as security_definer,
       p.proconfig, pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' order by p.proname;

-- 7) Function execute grants
select routine_name, grantee, privilege_type
from information_schema.routine_privileges where routine_schema = 'public' order by routine_name, grantee;

-- 8) Triggers (check for any existing stock decrement on pedidos/pedido_items)
select event_object_table, trigger_name, event_manipulation, action_timing, action_statement
from information_schema.triggers where trigger_schema = 'public' order by event_object_table, trigger_name;
