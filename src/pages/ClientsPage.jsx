import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  DollarSign, 
  Calendar, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Edit2,
  Trash2,
  X,
  CreditCard,
  ShoppingCart
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useData } from '../context/DataContext';

export const ClientsPage = ({ selectedClientForModal, onCloseModal, onOpenNewSaleWithClient }) => {
  const { customers, sales, addCustomer, updateCustomer, deleteCustomer, paySaleDebt, payTotalCustomerDebt, deleteSale } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'debt', 'clear'

  // Modal de Ficha do Cliente
  const [activeClient, setActiveClient] = useState(selectedClientForModal || null);
  // Modal de Cadastro/Edição de Cliente
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  // Estado para pagamento parcial no modal
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedSaleToPay, setSelectedSaleToPay] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    document: '',
    address: '',
    notes: '',
    credit_limit: ''
  });

  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Filtragem dos clientes
  const filteredCustomers = customers.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phone && client.phone.includes(searchTerm)) ||
      (client.document && client.document.includes(searchTerm));

    if (!matchesSearch) return false;

    if (filterTab === 'debt') return client.total_debt > 0;
    if (filterTab === 'clear') return client.total_debt === 0;
    return true;
  });

  // Abrir modal de novo cliente
  const handleOpenNew = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      document: '',
      address: '',
      notes: '',
      credit_limit: '1000'
    });
    setIsFormOpen(true);
  };

  // Abrir modal de edição
  const handleEdit = (client, e) => {
    e.stopPropagation();
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      document: client.document || '',
      address: client.address || '',
      notes: client.notes || '',
      credit_limit: client.credit_limit || ''
    });
    setIsFormOpen(true);
  };

  // Salvar cliente
  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (editingClient) {
      await updateCustomer(editingClient.id, formData);
      if (activeClient?.id === editingClient.id) {
        setActiveClient({ ...activeClient, ...formData });
      }
    } else {
      await addCustomer(formData);
    }
    setIsFormOpen(false);
  };

  // Deletar cliente
  const handleDelete = async (client, e) => {
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja excluir o cliente ${client.name}?`)) {
      await deleteCustomer(client.id);
      if (activeClient?.id === client.id) {
        setActiveClient(null);
      }
    }
  };

  // Dar baixa no pagamento total do cliente
  const handlePayTotalDebt = async (clientId) => {
    if (window.confirm('Confirmar o recebimento total de toda a dívida deste cliente?')) {
      await payTotalCustomerDebt(clientId);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
      const updated = customers.find(c => c.id === clientId);
      if (updated) setActiveClient({ ...updated, total_debt: 0 });
    }
  };

  // Dar baixa em venda específica
  const handlePaySpecificSale = async (saleId, amount) => {
    await paySaleDebt(saleId, amount);
    confetti({
      particleCount: 50,
      spread: 45,
      origin: { y: 0.6 }
    });
    setSelectedSaleToPay(null);
    setPaymentAmount('');
  };

  // Vendas do cliente selecionado no modal
  const clientSales = activeClient 
    ? sales.filter(s => s.customer_id === activeClient.id).sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Barra de Ações do Topo */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Filtros em Abas Segmentadas */}
        <div className="segmented-control">
          <button
            onClick={() => setFilterTab('all')}
            className={`segmented-btn ${filterTab === 'all' ? 'active' : ''}`}
          >
            Todos ({customers.length})
          </button>
          <button
            onClick={() => setFilterTab('debt')}
            className={`segmented-btn ${filterTab === 'debt' ? 'active-danger' : ''}`}
          >
            Com Débitos ({customers.filter(c => c.total_debt > 0).length})
          </button>
          <button
            onClick={() => setFilterTab('clear')}
            className={`segmented-btn ${filterTab === 'clear' ? 'active-success' : ''}`}
          >
            Em Dia ({customers.filter(c => c.total_debt === 0).length})
          </button>
        </div>

        {/* Busca e Botão de Cadastro */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'flex-end', minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar cliente por nome, telefone..."
              style={{ paddingLeft: '36px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleOpenNew}>
            <Plus size={16} /> Cadastrar Cliente
          </button>
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente / Contato</th>
                <th>Gasto no Mês</th>
                <th>Gasto Total</th>
                <th>Dívida Pendente</th>
                <th>Última Compra</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Nenhum cliente encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(client => (
                  <tr 
                    key={client.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setActiveClient(client)}
                  >
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {client.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        {client.phone && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Phone size={12} /> {client.phone}
                          </span>
                        )}
                        {client.document && <span>• Doc: {client.document}</span>}
                      </div>
                    </td>

                    {/* Gasto no Mês */}
                    <td style={{ fontWeight: 600, color: 'var(--primary-text)' }}>
                      {formatMoney(client.month_spent)}
                    </td>

                    {/* Gasto Total Histórico */}
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {formatMoney(client.total_spent)}
                    </td>

                    {/* Dívida Atual */}
                    <td>
                      {client.total_debt > 0 ? (
                        <div style={{ fontWeight: 700, color: 'var(--danger-text)' }}>
                          {formatMoney(client.total_debt)}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>R$ 0,00</span>
                      )}
                    </td>

                    {/* Última Compra */}
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {client.last_purchase_date || 'Nenhuma'}
                    </td>

                    {/* Status Badge */}
                    <td>
                      {client.total_debt > 0 ? (
                        <span className="badge badge-danger">
                          Devendo
                        </span>
                      ) : (
                        <span className="badge badge-success">
                          Em Dia
                        </span>
                      )}
                    </td>

                    {/* Ações */}
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Ver Extrato e Histórico"
                          onClick={() => setActiveClient(client)}
                        >
                          Ficha <ExternalLink size={13} />
                        </button>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="Editar"
                          onClick={(e) => handleEdit(client, e)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon"
                          title="Excluir"
                          onClick={(e) => handleDelete(client, e)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: FICHA DETALHADA DO CLIENTE (GASTOS, HISTÓRICO, DÉBITOS) */}
      {/* ============================================================== */}
      {activeClient && (
        <div className="modal-overlay" onClick={() => setActiveClient(null)}>
          <div 
            className="modal-content" 
            style={{ maxWidth: '850px' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)'
                }}>
                  <Users size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>{activeClient.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '10px' }}>
                    {activeClient.phone && <span>📞 {activeClient.phone}</span>}
                    {activeClient.email && <span>✉️ {activeClient.email}</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    onOpenNewSaleWithClient(activeClient);
                    setActiveClient(null);
                  }}
                >
                  <ShoppingCart size={14} /> Lançar Compra
                </button>
                <button 
                  className="btn btn-secondary btn-icon" 
                  onClick={() => setActiveClient(null)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Cards de Resumo Financeiro do Cliente */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px'
              }}>
                {/* Gasto Mês Atual */}
                <div style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-light)',
                  border: '1px solid var(--primary-border)'
                }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--primary-text)', fontWeight: 700 }}>
                    Gasto no Mês Atual
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
                    {formatMoney(activeClient.month_spent)}
                  </div>
                </div>

                {/* Total Gasto Histórico */}
                <div style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Total Histórico Gasto
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
                    {formatMoney(activeClient.total_spent)}
                  </div>
                </div>

                {/* Dívida Pendente */}
                <div style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: activeClient.total_debt > 0 ? 'var(--danger-light)' : 'var(--success-light)',
                  border: `1px solid ${activeClient.total_debt > 0 ? 'var(--danger-border)' : 'var(--success-border)'}`
                }}>
                  <div style={{ 
                    fontSize: '0.72rem', 
                    textTransform: 'uppercase', 
                    color: activeClient.total_debt > 0 ? 'var(--danger-text)' : 'var(--success-text)', 
                    fontWeight: 700 
                  }}>
                    {activeClient.total_debt > 0 ? 'Total Devendo' : 'Status Financeiro'}
                  </div>
                  <div style={{ 
                    fontSize: '1.4rem', 
                    fontWeight: 800, 
                    marginTop: '4px',
                    color: activeClient.total_debt > 0 ? 'var(--danger-text)' : 'var(--success-text)'
                  }}>
                    {activeClient.total_debt > 0 ? formatMoney(activeClient.total_debt) : 'Em Dia'}
                  </div>
                </div>
              </div>

              {/* Caixa de Ação Rápida de Quitação / Recebimento */}
              {activeClient.total_debt > 0 && (
                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--danger-light)',
                  border: '1px solid var(--danger-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--danger-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle size={16} /> Conta em Aberto: {formatMoney(activeClient.total_debt)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      O cliente efetuou um pagamento? Você pode quitar integralmente ou dar baixa nas compras abaixo.
                    </div>
                  </div>

                  <button 
                    className="btn btn-success"
                    onClick={() => handlePayTotalDebt(activeClient.id)}
                  >
                    <CheckCircle size={16} /> Quitar Toda a Dívida
                  </button>
                </div>
              )}

              {/* Extrato de Compras / Histórico */}
              <div>
                <h4 style={{ marginBottom: '12px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                  <FileText size={16} color="var(--primary)" /> Histórico de Compras & Gastos do Cliente ({clientSales.length})
                </h4>

                {clientSales.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                    Nenhuma compra registrada para este cliente ainda.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {clientSales.map(sale => (
                      <div 
                        key={sale.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          boxShadow: 'var(--shadow-xs)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ 
                              fontSize: '0.82rem', 
                              fontWeight: 700, 
                              color: 'var(--text-main)', 
                              background: 'var(--bg-subtle)', 
                              padding: '4px 8px', 
                              borderRadius: '6px' 
                            }}>
                              {sale.sale_date}
                            </span>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              Forma: {sale.payment_method?.toUpperCase()}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {sale.payment_status === 'pago' ? (
                              <span className="badge badge-success">Pago</span>
                            ) : sale.payment_status === 'parcial' ? (
                              <span className="badge badge-warning">Parcialmente Pago</span>
                            ) : (
                              <span className="badge badge-danger">Pendente / Devendo</span>
                            )}
                          </div>
                        </div>

                        {/* Itens da Compra */}
                        {sale.items && sale.items.length > 0 && (
                          <div style={{
                            background: 'var(--bg-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '8px 12px',
                            fontSize: '0.82rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}>
                            {sale.items.map((it, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)' }}>
                                <span>{it.quantity}x {it.product_name}</span>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{formatMoney(it.subtotal)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Totais & Ação de Baixa */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid var(--border-subtle)',
                          paddingTop: '8px',
                          fontSize: '0.88rem'
                        }}>
                          <div style={{ display: 'flex', gap: '16px', color: 'var(--text-main)' }}>
                            <span>Total: <strong>{formatMoney(sale.total_amount)}</strong></span>
                            <span style={{ color: 'var(--success-text)', fontWeight: 600 }}>Pago: {formatMoney(sale.paid_amount)}</span>
                            {sale.due_amount > 0 && (
                              <span style={{ color: 'var(--danger-text)', fontWeight: 700 }}>
                                Resta: {formatMoney(sale.due_amount)}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {sale.due_amount > 0 && (
                              <div>
                                {selectedSaleToPay === sale.id ? (
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <input
                                      type="number"
                                      className="form-control"
                                      style={{ width: '100px', padding: '4px 8px', fontSize: '0.82rem' }}
                                      placeholder="R$ Valor"
                                      value={paymentAmount}
                                      onChange={(e) => setPaymentAmount(e.target.value)}
                                    />
                                    <button
                                      className="btn btn-primary btn-sm"
                                      onClick={() => handlePaySpecificSale(sale.id, paymentAmount || sale.due_amount)}
                                    >
                                      Receber
                                    </button>
                                    <button
                                      className="btn btn-secondary btn-sm"
                                      onClick={() => setSelectedSaleToPay(null)}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => {
                                      setSelectedSaleToPay(sale.id);
                                      setPaymentAmount(sale.due_amount);
                                    }}
                                  >
                                    <CreditCard size={13} /> Dar Baixa
                                  </button>
                                )}
                              </div>
                            )}

                            <button
                              className="btn btn-danger btn-icon"
                              title="Excluir esta compra e devolver os produtos ao estoque"
                              style={{ width: '28px', height: '28px', padding: 0 }}
                              onClick={() => {
                                if (window.confirm('Excluir esta compra? Os produtos vendidos serão estornados (devolvidos) automaticamente para o estoque.')) {
                                  deleteSale(sale.id);
                                }
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveClient(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CADASTRO / EDIÇÃO DE CLIENTE                           */}
      {/* ============================================================== */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: 'var(--text-main)' }}>
                {editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setIsFormOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome Completo *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: João Ferreira"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CPF ou CNPJ</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="000.000.000-00"
                      value={formData.document}
                      onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="cliente@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Endereço</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rua, número, bairro..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Limite de Crédito / Fiado (R$)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Ex: 1500"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Observações Internas</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Preferências, dias de pagamento, observações adicionais..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
