import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  CreditCard, 
  Calendar,
  User,
  Trash2,
  DollarSign
} from 'lucide-react';
import { useData } from '../context/DataContext';

export const SalesPage = ({ onOpenNewSale }) => {
  const { sales, customers, deleteSale, paySaleDebt } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pago', 'devendo', 'parcial'

  // Modal para recebimento rápido
  const [payModal, setPayModal] = useState({
    open: false,
    sale: null,
    amount: ''
  });

  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Filtrar vendas
  const filteredSales = sales.filter(sale => {
    const client = customers.find(c => c.id === sale.customer_id);
    const clientName = client ? client.name.toLowerCase() : 'avulso balcão';
    const notes = sale.notes ? sale.notes.toLowerCase() : '';

    const matchesSearch = 
      clientName.includes(searchTerm.toLowerCase()) ||
      notes.includes(searchTerm.toLowerCase()) ||
      sale.sale_date.includes(searchTerm);

    if (!matchesSearch) return false;

    if (statusFilter === 'pago') return sale.payment_status === 'pago';
    if (statusFilter === 'pendente') return sale.payment_status === 'pendente';
    if (statusFilter === 'parcial') return sale.payment_status === 'parcial';

    return true;
  });

  // Confirmar pagamento
  const handleConfirmPay = async (e) => {
    e.preventDefault();
    const val = Number(payModal.amount);
    if (!val || val <= 0) return;

    await paySaleDebt(payModal.sale.id, val);
    setPayModal({ open: false, sale: null, amount: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Barra de Filtros e Lançamento */}
      <div className="page-top-bar" style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Status Pills */}
        <div className="segmented-control">
          <button
            onClick={() => setStatusFilter('all')}
            className={`segmented-btn ${statusFilter === 'all' ? 'active' : ''}`}
          >
            Todas ({sales.length})
          </button>
          <button
            onClick={() => setStatusFilter('pendente')}
            className={`segmented-btn ${statusFilter === 'pendente' ? 'active-danger' : ''}`}
          >
            Pendentes ({sales.filter(s => s.payment_status === 'pendente').length})
          </button>
          <button
            onClick={() => setStatusFilter('parcial')}
            className={`segmented-btn ${statusFilter === 'parcial' ? 'active-warning' : ''}`}
          >
            Parciais ({sales.filter(s => s.payment_status === 'parcial').length})
          </button>
          <button
            onClick={() => setStatusFilter('pago')}
            className={`segmented-btn ${statusFilter === 'pago' ? 'active-success' : ''}`}
          >
            Pagas ({sales.filter(s => s.payment_status === 'pago').length})
          </button>
        </div>

        {/* Busca e Botão Novo Lançamento */}
        <div className="page-top-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por cliente, notas..."
              style={{ paddingLeft: '36px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="btn btn-primary" onClick={onOpenNewSale}>
            <Plus size={16} /> Lançar Venda / Compra
          </button>
        </div>
      </div>

      {/* Tabela de Vendas & Gastos */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data da Compra</th>
                <th>Cliente</th>
                <th>Itens / Produtos</th>
                <th>Valor Total</th>
                <th>Pago</th>
                <th>Valor Devendo</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Nenhuma venda ou gasto encontrado com os critérios selecionados.
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => {
                  const client = customers.find(c => c.id === sale.customer_id);

                  return (
                    <tr key={sale.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{sale.sale_date}</div>
                        <div style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                          {sale.payment_method?.replace('_', ' ')}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {client ? client.name : 'Cliente Balcão / Avulso'}
                        </div>
                        {client?.phone && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {client.phone}
                          </div>
                        )}
                      </td>

                      {/* Itens */}
                      <td style={{ maxWidth: '260px' }}>
                        {sale.items && sale.items.length > 0 ? (
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {sale.items.map(it => `${it.quantity}x ${it.product_name}`).join(', ')}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Item avulso / serviço</span>
                        )}
                        {sale.notes && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>
                            obs: {sale.notes}
                          </div>
                        )}
                      </td>

                      <td style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {formatMoney(sale.total_amount)}
                      </td>

                      <td style={{ color: 'var(--success-text)', fontWeight: 600 }}>
                        {formatMoney(sale.paid_amount)}
                      </td>

                      <td>
                        {sale.due_amount > 0 ? (
                          <span style={{ color: 'var(--danger-text)', fontWeight: 700 }}>
                            {formatMoney(sale.due_amount)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>R$ 0,00</span>
                        )}
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

                      {/* Ações */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {sale.due_amount > 0 && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ color: 'var(--success-text)', borderColor: 'var(--success-border)' }}
                              title="Dar Baixa no Pagamento"
                              onClick={() => setPayModal({ open: true, sale, amount: sale.due_amount })}
                            >
                              <CreditCard size={13} /> Receber
                            </button>
                          )}
                          <button
                            className="btn btn-danger btn-icon"
                            title="Excluir Venda e devolver itens ao estoque"
                            onClick={() => {
                              if (window.confirm('Excluir este lançamento de venda? Os produtos serão estornados (devolvidos) automaticamente para o estoque.')) {
                                deleteSale(sale.id);
                              }
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PARA RECEBER PAGAMENTO */}
      {payModal.open && (
        <div className="modal-overlay" onClick={() => setPayModal({ open: false, sale: null, amount: '' })}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Receber Pagamento</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setPayModal({ open: false, sale: null, amount: '' })}>
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPay}>
              <div className="modal-body">
                <p style={{ fontSize: '0.9rem', marginBottom: '14px', color: 'var(--text-secondary)' }}>
                  Venda de <strong>{formatMoney(payModal.sale?.total_amount)}</strong><br />
                  Valor atualmente em aberto: <strong style={{ color: 'var(--danger-text)' }}>{formatMoney(payModal.sale?.due_amount)}</strong>
                </p>

                <div className="form-group">
                  <label className="form-label">Valor a Dar Baixa (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    autoFocus
                    value={payModal.amount}
                    onChange={(e) => setPayModal({ ...payModal, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setPayModal({ open: false, sale: null, amount: '' })}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
