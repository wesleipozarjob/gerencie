-- Gerencie: adiciona a foto/logo da empresa como binário (BYTEA)
-- Rode uma vez no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/kmobwowcxegheknlosgx/sql

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo BYTEA;

-- Atualiza o cache de schema da API para reconhecer a nova coluna imediatamente
NOTIFY pgrst, 'reload schema';
