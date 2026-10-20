// Dados iniciais e estrutura para multi-empresa e persistência local

export const INITIAL_COMPANIES = [
  {
    id: 'empresa-1',
    name: 'Distribuidora & Comércio Alpha',
    trade_name: 'Alpha Distribuidora',
    document: '12.345.678/0001-90',
    phone: '(11) 98765-4321',
    email: 'contato@alpha.com.br',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'empresa-2',
    name: 'Mercado & Conveniência Vista Bela',
    trade_name: 'Vista Bela Market',
    document: '98.765.432/0001-10',
    phone: '(11) 97777-8888',
    email: 'gerencia@vistabela.com',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString()
  }
];

export const INITIAL_CUSTOMERS = [
  {
    id: 'cust-1',
    company_id: 'empresa-1',
    name: 'Carlos Eduardo Silveira',
    phone: '(11) 99123-4567',
    email: 'carlos.eduardo@email.com',
    document: '123.456.789-00',
    address: 'Rua das Flores, 142 - Centro',
    notes: 'Cliente fiel. Costuma comprar aos sábados.',
    credit_limit: 3000.00,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString()
  },
  {
    id: 'cust-2',
    company_id: 'empresa-1',
    name: 'Mariana Santos Oliveira',
    phone: '(11) 98234-5678',
    email: 'mariana.santos@email.com',
    document: '987.654.321-11',
    address: 'Av. Brasil, 890 - Apto 34',
    notes: 'Paga sempre via PIX no dia 10.',
    credit_limit: 1500.00,
    created_at: new Date(Date.now() - 18 * 86400000).toISOString()
  },
  {
    id: 'cust-3',
    company_id: 'empresa-1',
    name: 'Padaria & Confeitaria Pão Dourado',
    phone: '(11) 97345-6789',
    email: 'compras@paodourado.com.br',
    document: '45.123.890/0001-22',
    address: 'Rua São Paulo, 550 - Bairro Alto',
    notes: 'Faturamento quinzenal para atacado.',
    credit_limit: 8000.00,
    created_at: new Date(Date.now() - 40 * 86400000).toISOString()
  },
  {
    id: 'cust-4',
    company_id: 'empresa-2',
    name: 'Fernando Guimarães',
    phone: '(21) 99888-1122',
    email: 'fernando.g@email.com',
    document: '444.555.666-77',
    address: 'Rua das Palmeiras, 77',
    notes: 'Cliente avulso com limite aberto.',
    credit_limit: 1000.00,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString()
  }
];

export const INITIAL_PRODUCTS = [
  {
    id: 'prod-1',
    company_id: 'empresa-1',
    name: 'Farinha de Trigo Especial 5kg',
    sku: 'FAR-001',
    category: 'Alimentos',
    cost_price: 14.50,
    sale_price: 24.90,
    stock_quantity: 42,
    min_stock: 10,
    unit: 'pct',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'prod-2',
    company_id: 'empresa-1',
    name: 'Óleo de Soja Refinado 900ml',
    sku: 'OLE-002',
    category: 'Alimentos',
    cost_price: 4.20,
    sale_price: 7.50,
    stock_quantity: 6, // Estoque baixo! Alerta!
    min_stock: 15,
    unit: 'un',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'prod-3',
    company_id: 'empresa-1',
    name: 'Açúcar Cristal 5kg',
    sku: 'ACU-003',
    category: 'Alimentos',
    cost_price: 12.00,
    sale_price: 19.80,
    stock_quantity: 55,
    min_stock: 20,
    unit: 'pct',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'prod-4',
    company_id: 'empresa-1',
    name: 'Café Torrado e Moído 500g',
    sku: 'CAF-004',
    category: 'Bebidas',
    cost_price: 11.30,
    sale_price: 18.90,
    stock_quantity: 4, // Estoque baixo!
    min_stock: 12,
    unit: 'pct',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'prod-5',
    company_id: 'empresa-1',
    name: 'Refrigerante Cola 2 Litros',
    sku: 'BEB-005',
    category: 'Bebidas',
    cost_price: 5.50,
    sale_price: 9.90,
    stock_quantity: 36,
    min_stock: 15,
    unit: 'un',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'prod-6',
    company_id: 'empresa-2',
    name: 'Água Mineral sem Gás 500ml',
    sku: 'AGU-001',
    category: 'Bebidas',
    cost_price: 1.20,
    sale_price: 3.50,
    stock_quantity: 120,
    min_stock: 30,
    unit: 'un',
    is_active: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString()
  }
];

// Compras e contas de clientes com valores pagos e pendentes
const now = new Date();
const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

export const INITIAL_SALES = [
  {
    id: 'sale-1',
    company_id: 'empresa-1',
    customer_id: 'cust-1', // Carlos
    total_amount: 320.50,
    paid_amount: 320.50,
    due_amount: 0.00,
    payment_status: 'pago',
    payment_method: 'pix',
    notes: 'Compra mensal de mantimentos',
    sale_date: `${currentMonthStr}-05`,
    items: [
      { product_id: 'prod-1', product_name: 'Farinha de Trigo Especial 5kg', quantity: 5, unit_price: 24.90, subtotal: 124.50 },
      { product_id: 'prod-3', product_name: 'Açúcar Cristal 5kg', quantity: 6, unit_price: 19.80, subtotal: 118.80 },
      { product_id: 'prod-4', product_name: 'Café Torrado e Moído 500g', quantity: 4, unit_price: 18.90, subtotal: 77.20 }
    ],
    created_at: new Date(now.getFullYear(), now.getMonth(), 5, 14, 30).toISOString()
  },
  {
    id: 'sale-2',
    company_id: 'empresa-1',
    customer_id: 'cust-1', // Carlos
    total_amount: 185.00,
    paid_amount: 0.00,
    due_amount: 185.00,
    payment_status: 'pendente',
    payment_method: 'a_prazo',
    notes: 'Compra no fiado - acerto para o final do mês',
    sale_date: `${currentMonthStr}-14`,
    items: [
      { product_id: 'prod-1', product_name: 'Farinha de Trigo Especial 5kg', quantity: 3, unit_price: 24.90, subtotal: 74.70 },
      { product_id: 'prod-5', product_name: 'Refrigerante Cola 2 Litros', quantity: 10, unit_price: 9.90, subtotal: 99.00 },
      { product_id: 'prod-2', product_name: 'Óleo de Soja Refinado 900ml', quantity: 1, unit_price: 7.50, subtotal: 7.50 }
    ],
    created_at: new Date(now.getFullYear(), now.getMonth(), 14, 10, 15).toISOString()
  },
  {
    id: 'sale-3',
    company_id: 'empresa-1',
    customer_id: 'cust-2', // Mariana
    total_amount: 450.00,
    paid_amount: 200.00,
    due_amount: 250.00,
    payment_status: 'parcial',
    payment_method: 'a_prazo',
    notes: 'Deu entrada de R$ 200,00 e restam R$ 250,00',
    sale_date: `${currentMonthStr}-12`,
    items: [
      { product_id: 'prod-3', product_name: 'Açúcar Cristal 5kg', quantity: 15, unit_price: 19.80, subtotal: 297.00 },
      { product_id: 'prod-5', product_name: 'Refrigerante Cola 2 Litros', quantity: 15, unit_price: 9.90, subtotal: 148.50 }
    ],
    created_at: new Date(now.getFullYear(), now.getMonth(), 12, 16, 45).toISOString()
  },
  {
    id: 'sale-4',
    company_id: 'empresa-1',
    customer_id: 'cust-3', // Padaria Pão Dourado
    total_amount: 1420.00,
    paid_amount: 0.00,
    due_amount: 1420.00,
    payment_status: 'pendente',
    payment_method: 'a_prazo',
    notes: 'Pedido de estoque semanal para padaria',
    sale_date: `${currentMonthStr}-16`,
    items: [
      { product_id: 'prod-1', product_name: 'Farinha de Trigo Especial 5kg', quantity: 40, unit_price: 24.90, subtotal: 996.00 },
      { product_id: 'prod-3', product_name: 'Açúcar Cristal 5kg', quantity: 20, unit_price: 19.80, subtotal: 396.00 }
    ],
    created_at: new Date(now.getFullYear(), now.getMonth(), 16, 9, 0).toISOString()
  }
];

export const INITIAL_STOCK_MOVEMENTS = [
  {
    id: 'mov-1',
    company_id: 'empresa-1',
    product_id: 'prod-1',
    movement_type: 'entrada',
    quantity: 50,
    previous_stock: 0,
    new_stock: 50,
    reason: 'Carga inicial do fornecedor NF #1029',
    created_at: new Date(Date.now() - 28 * 86400000).toISOString()
  },
  {
    id: 'mov-2',
    company_id: 'empresa-1',
    product_id: 'prod-2',
    movement_type: 'ajuste',
    quantity: -2,
    previous_stock: 8,
    new_stock: 6,
    reason: 'Avaria na embalagem durante transporte',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  }
];
