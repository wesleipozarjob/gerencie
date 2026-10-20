-- ==============================================================================
-- GERENCIE - SCRIPT DE CRIAÇÃO DO BANCO DE DADOS (SUPABASE POSTGRESQL)
-- Multi-empresa (Multi-tenant), Gestão de Clientes, Vendas/Gastos e Estoque
-- Execute este script no SQL Editor do seu projeto Supabase:
-- Project ID: kmobwowcxegheknlosgx (https://supabase.com/dashboard/project/kmobwowcxegheknlosgx/sql)
-- ==============================================================================

-- 1. Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Empresas (Tenants)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    trade_name TEXT,
    document TEXT, -- CNPJ ou CPF
    phone TEXT,
    email TEXT,
    logo BYTEA, -- Foto/Logo da empresa em binário puro (WebP comprimido ~10-20KB)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir coluna logo se a tabela já existia:
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo BYTEA;

-- 3. Tabela de Perfis de Usuários vinculados a Empresas
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'admin', -- 'admin', 'operator', 'manager'
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    document TEXT, -- CPF ou CNPJ
    address TEXT,
    notes TEXT,
    credit_limit NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Produtos / Estoque
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT, -- Código / Código de barras
    category TEXT DEFAULT 'Geral',
    cost_price NUMERIC(12, 2) DEFAULT 0.00,
    sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    stock_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    min_stock NUMERIC(12, 2) DEFAULT 5.00,
    unit TEXT DEFAULT 'un', -- 'un', 'kg', 'cx', 'pct', 'lt'
    package_units NUMERIC(10, 2) DEFAULT 1, -- Quantidade de unidades que vêm no pacote/caixa
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Vendas / Contas de Clientes (Gastos e Dívidas)
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    due_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_status TEXT NOT NULL DEFAULT 'pendente', -- 'pago', 'parcial', 'pendente'
    payment_method TEXT DEFAULT 'a_prazo', -- 'pix', 'dinheiro', 'cartao', 'a_prazo'
    notes TEXT,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Itens da Venda
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 1.00,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Movimentações de Estoque (Histórico de Entradas, Saídas, Ajustes e Vendas)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL, -- 'entrada', 'saida', 'venda', 'ajuste'
    quantity NUMERIC(12, 2) NOT NULL,
    previous_stock NUMERIC(12, 2) NOT NULL,
    new_stock NUMERIC(12, 2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Índices para performance rápida
CREATE INDEX IF NOT EXISTS idx_customers_company ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_company ON public.sales(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON public.sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_prod ON public.stock_movements(product_id);

-- 10. Habilitar RLS (Row Level Security) em todas as tabelas
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- 11. Funções Auxiliares de Segurança Multi-Tenant (PostgreSQL)

-- Função para verificar se o usuário autenticado é o Administrador Master do sistema
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    LOWER(auth.jwt() ->> 'email') = 'weslei.pozar@hotmail.com',
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter a empresa vinculada ao usuário autenticado atual
CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para validar se o usuário tem permissão para acessar determinada empresa
CREATE OR REPLACE FUNCTION public.user_has_company_access(target_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Master admin (Weslei Pozar) tem acesso a todas as empresas
  IF public.is_master_admin() THEN
    RETURN true;
  END IF;

  -- 2. Usuário com vínculo direto no seu perfil
  IF target_company_id = public.get_current_user_company_id() THEN
    RETURN true;
  END IF;

  -- 3. Usuário cujo e-mail cadastrado na empresa coincide com o e-mail de login
  IF EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = target_company_id
      AND LOWER(c.email) = LOWER(auth.jwt() ->> 'email')
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Políticas de Segurança Granulares (Row Level Security - RLS)

-- Remover políticas antigas permissivas caso existam
DROP POLICY IF EXISTS "Acesso perfis" ON public.profiles;
DROP POLICY IF EXISTS "Acesso empresas" ON public.companies;
DROP POLICY IF EXISTS "Acesso clientes" ON public.customers;
DROP POLICY IF EXISTS "Acesso produtos" ON public.products;
DROP POLICY IF EXISTS "Acesso vendas" ON public.sales;
DROP POLICY IF EXISTS "Acesso itens_venda" ON public.sale_items;
DROP POLICY IF EXISTS "Acesso movimentacoes" ON public.stock_movements;

DROP POLICY IF EXISTS "RLS_profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "RLS_profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "RLS_profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "RLS_companies_select" ON public.companies;
DROP POLICY IF EXISTS "RLS_companies_insert" ON public.companies;
DROP POLICY IF EXISTS "RLS_companies_update" ON public.companies;
DROP POLICY IF EXISTS "RLS_companies_delete" ON public.companies;
DROP POLICY IF EXISTS "RLS_customers_all" ON public.customers;
DROP POLICY IF EXISTS "RLS_products_all" ON public.products;
DROP POLICY IF EXISTS "RLS_sales_all" ON public.sales;
DROP POLICY IF EXISTS "RLS_sale_items_all" ON public.sale_items;
DROP POLICY IF EXISTS "RLS_stock_movements_all" ON public.stock_movements;

-- A. TABELA: PROFILES
CREATE POLICY "RLS_profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_master_admin());

CREATE POLICY "RLS_profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_master_admin());

CREATE POLICY "RLS_profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_master_admin());

-- B. TABELA: COMPANIES
CREATE POLICY "RLS_companies_select" ON public.companies
  FOR SELECT USING (public.is_master_admin() OR id = public.get_current_user_company_id() OR LOWER(email) = LOWER(auth.jwt() ->> 'email'));

CREATE POLICY "RLS_companies_insert" ON public.companies
  FOR INSERT WITH CHECK (public.is_master_admin());

CREATE POLICY "RLS_companies_update" ON public.companies
  FOR UPDATE USING (public.is_master_admin() OR id = public.get_current_user_company_id());

CREATE POLICY "RLS_companies_delete" ON public.companies
  FOR DELETE USING (public.is_master_admin());

-- C. TABELA: CUSTOMERS (CLIENTES)
CREATE POLICY "RLS_customers_all" ON public.customers
  FOR ALL 
  USING (public.user_has_company_access(company_id))
  WITH CHECK (public.user_has_company_access(company_id));

-- D. TABELA: PRODUCTS (PRODUTOS / ESTOQUE)
CREATE POLICY "RLS_products_all" ON public.products
  FOR ALL 
  USING (public.user_has_company_access(company_id))
  WITH CHECK (public.user_has_company_access(company_id));

-- E. TABELA: SALES (VENDAS / CONTAS)
CREATE POLICY "RLS_sales_all" ON public.sales
  FOR ALL 
  USING (public.user_has_company_access(company_id))
  WITH CHECK (public.user_has_company_access(company_id));

-- F. TABELA: SALE_ITEMS (ITENS DA VENDA)
CREATE POLICY "RLS_sale_items_all" ON public.sale_items
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.sales s 
      WHERE s.id = sale_items.sale_id 
        AND public.user_has_company_access(s.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales s 
      WHERE s.id = sale_items.sale_id 
        AND public.user_has_company_access(s.company_id)
    )
  );

-- G. TABELA: STOCK_MOVEMENTS (HISTÓRICO DE ESTOQUE)
CREATE POLICY "RLS_stock_movements_all" ON public.stock_movements
  FOR ALL 
  USING (public.user_has_company_access(company_id))
  WITH CHECK (public.user_has_company_access(company_id));

-- 12. Dados de Exemplo (Opcional - insere uma empresa modelo caso deseje)
INSERT INTO public.companies (id, name, trade_name, document, phone, email)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Distribuidora & Comércio Alpha Ltda', 'Alpha Distribuidora', '12.345.678/0001-90', '(11) 98765-4321', 'contato@alpha.com.br')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.customers (company_id, name, phone, email, document, notes, credit_limit)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Carlos Eduardo Silveira', '(11) 99123-4567', 'carlos.edu@gmail.com', '123.456.789-00', 'Cliente preferencial, compra semanalmente.', 2500.00),
    ('00000000-0000-0000-0000-000000000001', 'Mariana Santos Oliveira', '(11) 98234-5678', 'mariana.santos@outlook.com', '987.654.321-11', 'Costuma pagar no dia 10 de cada mês.', 1500.00),
    ('00000000-0000-0000-0000-000000000001', 'Roberto Albuquerque ME', '(11) 97345-6789', 'roberto@albuquerque.com', '45.123.890/0001-22', 'Padaria Central - compras de insumos.', 5000.00)
ON CONFLICT DO NOTHING;

INSERT INTO public.products (company_id, name, sku, category, cost_price, sale_price, stock_quantity, min_stock, unit)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Farinha de Trigo Especial 5kg', 'FAR-001', 'Alimentos', 14.50, 24.90, 45, 10, 'pct'),
    ('00000000-0000-0000-0000-000000000001', 'Óleo de Soja 900ml', 'OLE-002', 'Alimentos', 4.20, 7.50, 8, 15, 'un'),
    ('00000000-0000-0000-0000-000000000001', 'Açúcar Cristal 5kg', 'ACU-003', 'Alimentos', 12.00, 19.80, 60, 20, 'pct'),
    ('00000000-0000-0000-0000-000000000001', 'Café Tradicional 500g', 'CAF-004', 'Bebidas', 11.30, 18.90, 3, 10, 'pct')
ON CONFLICT DO NOTHING;
