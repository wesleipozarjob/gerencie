import React from 'react';
import { 
  DollarSign, 
  AlertCircle, 
  Users, 
  Package, 
  TrendingUp, 
  CheckCircle,
  PlusCircle,
  ChevronRight
} from 'lucide-react';
import { useData } from '../context/DataContext';

export const Dashboard = ({ setActiveTab, onOpenNewSale, onOpenNewClient, onOpenNewProduct, onViewClient }) => {
  const { customers, products, sales, dashboardStats } = useData();

  // Formatar Moeda Real (BRL)
  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Clientes com maior débito pendente
  const debtorClients = [...customers]
    .filter(c => c.total_debt > 0)
    .sort((a, b) => b.total_debt - a.total_debt)
    .slice(0, 5);

  // Vendas recentes
  const recentSales = sales.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Banner de Boas-Vindas & Ações Rápidas */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
        borderColor: '#bfdbfe',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '4px', color: 'var(--text-main)' }}>
            Painel de Controle
          </h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Acompanhe em tempo real o fluxo de clientes, contas a receber e movimentação do estoque.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={onOpenNewClient}>
            <Users size={16} color="var(--primary)" /> Novo Cliente
          </button>
          <button className="btn btn-secondary" onClick={onOpenNewProduct}>
            <Package size={16} color="var(--primary)" /> Novo Produto
          </button>
          <button className="btn btn-primary" onClick={onOpenNewSale}>
            <PlusCircle size={16} /> Lançar Venda
          </button>
        </div>
      </div>

      {/* Grid de 4 Cards de Métricas Principais */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 1: Faturamento Mês */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Faturamento do Mês
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarSign size={18} color="var(--primary)" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {formatMoney(dashboardStats.monthRevenue)}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--success-text)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <TrendingUp size={13} /> {dashboardStats.monthSalesCount} lançamentos neste mês
            </div>
          </div>
        </div>

        {/* Card 2: Total a Receber (Contas Pendentes / Débitos de Clientes) */}
        <div className="card" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          borderColor: dashboardStats.totalDebt > 0 ? 'var(--danger-border)' : undefined,
          background: dashboardStats.totalDebt > 0 ? '#fffdfd' : '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Contas a Receber (Débitos)
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--danger-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertCircle size={18} color="var(--danger)" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--danger-text)' }}>
              {formatMoney(dashboardStats.totalDebt)}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {dashboardStats.customersWithDebt} cliente(s) com pagamentos pendentes
            </div>
          </div>
        </div>

        {/* Card 3: Clientes */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Clientes Ativos
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={18} color="var(--primary)" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {dashboardStats.totalCustomers}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {dashboardStats.totalCustomers - dashboardStats.customersWithDebt} clientes em dia
            </div>
          </div>
        </div>

        {/* Card 4: Valor do Estoque & Alerta */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Patrimônio em Estoque
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--warning-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package size={18} color="var(--warning)" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {formatMoney(dashboardStats.totalInventoryValue)}
            </div>
            <div style={{ fontSize: '0.78rem', color: dashboardStats.lowStockCount > 0 ? 'var(--warning-text)' : 'var(--text-muted)', marginTop: '4px', fontWeight: dashboardStats.lowStockCount > 0 ? 600 : 400 }}>
              {dashboardStats.lowStockCount > 0 
                ? `⚠️ ${dashboardStats.lowStockCount} produto(s) com estoque baixo` 
                : `${dashboardStats.totalProducts} produtos cadastrados`}
            </div>
          </div>
        </div>
      </div>

      {/* Grid de 2 Colunas: Clientes Devedores vs Alertas de Estoque */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '24px'
      }}>
        {/* Coluna 1: Clientes com Contas / Débitos em Aberto */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '2px', color: 'var(--text-main)' }}>Clientes com Débitos</h3>
              <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-muted)' }}>Maiores contas pendentes de pagamento</p>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('clients')}
            >
              Ver Todos <ChevronRight size={14} />
            </button>
          </div>

          {debtorClients.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle size={32} color="var(--success)" style={{ margin: '0 auto 8px' }} />
              <div>Parabéns! Nenhum cliente com débitos no momento.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {debtorClients.map(client => (
                <div 
                  key={client.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-strong)';
                    e.currentTarget.style.background = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.background = 'var(--bg-subtle)';
                  }}
                  onClick={() => onViewClient(client)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>{client.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {client.phone || 'Sem telefone'} • {client.sales_count} compra(s)
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--danger-text)' }}>
                      {formatMoney(client.total_debt)}
                    </div>
                    <span className="badge badge-danger" style={{ fontSize: '0.68rem' }}>
                      Devendo
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coluna 2: Alertas Críticos de Estoque */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '2px', color: 'var(--text-main)' }}>Atenção ao Estoque</h3>
              <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-muted)' }}>Produtos no limite mínimo ou esgotados</p>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('stock')}
            >
              Ir ao Estoque <ChevronRight size={14} />
            </button>
          </div>

          {dashboardStats.lowStockProducts.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle size={32} color="var(--success)" style={{ margin: '0 auto 8px' }} />
              <div>Todos os produtos estão com níveis saudáveis de estoque.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {dashboardStats.lowStockProducts.map(prod => (
                <div 
                  key={prod.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'var(--warning-light)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--warning-border)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>{prod.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      SKU: {prod.sku} • Categoria: {prod.category}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--warning-text)' }}>
                      {prod.stock_quantity} {prod.unit}
                    </div>
                    <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>
                      Mínimo: {prod.min_stock} {prod.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Vendas / Compras Recentes */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '2px', color: 'var(--text-main)' }}>Últimas Vendas & Gastos Registrados</h3>
            <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-muted)' }}>Histórico recente de movimentações no caixa</p>
          </div>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('sales')}
          >
            Ver Todas <ChevronRight size={14} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Valor Total</th>
                <th>Pago</th>
                <th>Pendente</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map(sale => {
                const client = customers.find(c => c.id === sale.customer_id);
                return (
                  <tr key={sale.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {sale.sale_date}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {client ? client.name : 'Cliente Balcão / Avulso'}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      {formatMoney(sale.total_amount)}
                    </td>
                    <td style={{ color: 'var(--success-text)', fontWeight: 600 }}>
                      {formatMoney(sale.paid_amount)}
                    </td>
                    <td style={{ color: sale.due_amount > 0 ? 'var(--danger-text)' : 'var(--text-muted)', fontWeight: sale.due_amount > 0 ? 700 : 400 }}>
                      {formatMoney(sale.due_amount)}
                    </td>
                    <td>
                      {sale.payment_status === 'pago' ? (
                        <span className="badge badge-success">Pago</span>
                      ) : sale.payment_status === 'parcial' ? (
                        <span className="badge badge-warning">Parcial</span>
                      ) : (
                        <span className="badge badge-danger">Devendo</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
