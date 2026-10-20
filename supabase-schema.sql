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

-- 11. Políticas de Segurança (Permitir acesso completo a usuários autenticados para sua empresa ou anon para demonstração)
-- Criação de política pública/autenticada para garantir funcionamento fácil
CREATE POLICY "Acesso perfis" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso empresas" ON public.companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso clientes" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso produtos" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso vendas" ON public.sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso itens_venda" ON public.sale_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso movimentacoes" ON public.stock_movements FOR ALL USING (true) WITH CHECK (true);

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
