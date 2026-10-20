import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  AlertTriangle, 
  History, 
  Edit2, 
  Trash2, 
  X,
  FileSpreadsheet,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { useData } from '../context/DataContext';

export const StockPage = () => {
  const { products, stockMovements, addProduct, updateProduct, deleteProduct, adjustStock } = useData();

  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'movements'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStockStatus, setFilterStockStatus] = useState('all'); // 'all', 'low', 'out'

  // Modal de Cadastro/Edição
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Modal de Ajuste Rápido de Entrada/Saída
  const [adjustModal, setAdjustModal] = useState({
    open: false,
    product: null,
    type: 'entrada', // 'entrada' ou 'saida'
    quantity: '',
    reason: ''
  });

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    cost_price: '',
    sale_price: '',
    stock_quantity: '',
    min_stock: '',
    unit: 'un'
  });

  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Categorias únicas
  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Filtragem de Produtos
  const filteredProducts = products.filter(prod => {
    const matchesSearch = 
      prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prod.sku && prod.sku.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterCategory !== 'all' && prod.category !== filterCategory) return false;

    const qty = Number(prod.stock_quantity) || 0;
    const min = Number(prod.min_stock) || 0;

    if (filterStockStatus === 'low') return qty <= min && qty > 0;
    if (filterStockStatus === 'out') return qty <= 0;

    return true;
  });

  // Abrir modal de novo produto
  const handleOpenNew = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      category: '',
      cost_price: '',
      sale_price: '',
      stock_quantity: '0',
      min_stock: '5',
      unit: 'un'
    });
    setIsFormOpen(true);
  };

  // Abrir modal de edição
  const handleEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name || '',
      sku: prod.sku || '',
      category: prod.category || '',
      cost_price: prod.cost_price || '',
      sale_price: prod.sale_price || '',
      stock_quantity: prod.stock_quantity || '0',
      min_stock: prod.min_stock || '5',
      unit: prod.unit || 'un'
    });
    setIsFormOpen(true);
  };

  // Salvar Produto
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (editingProduct) {
      await updateProduct(editingProduct.id, formData);
    } else {
      await addProduct(formData);
    }
    setIsFormOpen(false);
  };

  // Deletar Produto
  const handleDelete = async (prod) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${prod.name}"?`)) {
      await deleteProduct(prod.id);
    }
  };

  // Submeter ajuste rápido de estoque
  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    const qty = Number(adjustModal.quantity);
    if (!qty || qty <= 0) return;

    const delta = adjustModal.type === 'entrada' ? qty : -qty;
    await adjustStock(adjustModal.product.id, delta, adjustModal.reason || (adjustModal.type === 'entrada' ? 'Entrada avulsa' : 'Baixa avulsa'));
    setAdjustModal({ open: false, product: null, type: 'entrada', quantity: '', reason: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Abas Superiores: Estoque Atual vs Histórico de Movimentações */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div className="segmented-control">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`segmented-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          >
            <Package size={15} /> Produtos & Estoque ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`segmented-btn ${activeTab === 'movements' ? 'active' : ''}`}
          >
            <History size={15} /> Histórico de Movimentações ({stockMovements.length})
          </button>
        </div>

        {activeTab === 'inventory' && (
          <button className="btn btn-primary" onClick={handleOpenNew}>
            <Plus size={16} /> Cadastrar Produto
          </button>
        )}
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Barra de Filtros e Busca */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Buscar produto por nome, SKU..."
                style={{ paddingLeft: '36px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {/* Filtro por Categoria */}
              <select
                className="form-control"
                style={{ width: 'auto', minWidth: '140px', padding: '8px 12px', fontSize: '0.85rem' }}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">Todas Categorias</option>
                {categories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Filtro por Status */}
              <select
                className="form-control"
                style={{ width: 'auto', minWidth: '140px', padding: '8px 12px', fontSize: '0.85rem' }}
                value={filterStockStatus}
                onChange={(e) => setFilterStockStatus(e.target.value)}
              >
                <option value="all">Todos os Status</option>
                <option value="low">⚠️ Estoque Baixo</option>
                <option value="out">🛑 Esgotados (0)</option>
              </select>
            </div>
          </div>

          {/* Tabela de Produtos */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Produto / SKU</th>
                    <th>Categoria</th>
                    <th>Preço Custo</th>
                    <th>Preço Venda</th>
                    <th>Estoque Atual</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Ajuste Rápido / Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        Nenhum produto encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(prod => {
                      const qty = Number(prod.stock_quantity) || 0;
                      const min = Number(prod.min_stock) || 0;
                      const isLow = qty <= min && qty > 0;
                      const isOut = qty <= 0;

                      return (
                        <tr key={prod.id}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>{prod.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              SKU: {prod.sku || 'Sem código'}
                            </div>
                          </td>

                          <td>
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '3px 8px',
                              background: 'var(--bg-subtle)',
                              borderRadius: '4px',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-secondary)'
                            }}>
                              {prod.category}
                            </span>
                          </td>

                          <td style={{ color: 'var(--text-muted)' }}>
                            {formatMoney(prod.cost_price)}
                          </td>

                          <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {formatMoney(prod.sale_price)}
                          </td>

                          {/* Quantidade em Estoque */}
                          <td>
                            <div style={{
                              fontWeight: 800,
                              fontSize: '1rem',
                              color: isOut ? 'var(--danger-text)' : isLow ? 'var(--warning-text)' : 'var(--success-text)'
                            }}>
                              {qty} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>{prod.unit}</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Mínimo: {min} {prod.unit}
                            </div>
                          </td>

                          {/* Badge */}
                          <td>
                            {isOut ? (
                              <span className="badge badge-danger">Esgotado</span>
                            ) : isLow ? (
                              <span className="badge badge-warning">Estoque Baixo</span>
                            ) : (
                              <span className="badge badge-success">Normal</span>
                            )}
                          </td>

                          {/* Ações */}
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              {/* Ajuste rápido + / - */}
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 8px', color: 'var(--success-text)', borderColor: 'var(--success-border)' }}
                                title="Entrada de Estoque (+)"
                                onClick={() => setAdjustModal({ open: true, product: prod, type: 'entrada', quantity: '', reason: '' })}
                              >
                                <ArrowUp size={13} /> Entrada
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 8px', color: 'var(--danger-text)', borderColor: 'var(--danger-border)' }}
                                title="Saída / Baixa (-)"
                                onClick={() => setAdjustModal({ open: true, product: prod, type: 'saida', quantity: '', reason: '' })}
                              >
                                <ArrowDown size={13} /> Saída
                              </button>
                              <button
                                className="btn btn-secondary btn-icon"
                                title="Editar"
                                onClick={() => handleEdit(prod)}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                className="btn btn-danger btn-icon"
                                title="Excluir"
                                onClick={() => handleDelete(prod)}
                              >
                                <Trash2 size={14} />
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
        </>
      ) : (
        /* Histórico de Movimentações */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Produto</th>
                  <th>Tipo</th>
                  <th>Quantidade</th>
                  <th>Estoque Anterior</th>
                  <th>Novo Estoque</th>
                  <th>Motivo / Observação</th>
                </tr>
              </thead>
              <tbody>
                {stockMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      Nenhuma movimentação registrada até o momento.
                    </td>
                  </tr>
                ) : (
                  stockMovements.map(mov => {
                    const prod = products.find(p => p.id === mov.product_id);
                    return (
                      <tr key={mov.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {new Date(mov.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {prod ? prod.name : 'Produto removido'}
                        </td>
                        <td>
                          {mov.movement_type === 'entrada' ? (
                            <span className="badge badge-success">Entrada</span>
                          ) : mov.movement_type === 'venda' ? (
                            <span className="badge badge-blue">Venda</span>
                          ) : mov.movement_type === 'saida' ? (
                            <span className="badge badge-danger">Saída</span>
                          ) : (
                            <span className="badge badge-warning">Ajuste</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          {mov.movement_type === 'entrada' ? `+${mov.quantity}` : `-${mov.quantity}`}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {mov.previous_stock}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          {mov.new_stock}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {mov.reason || 'Movimentação padrão'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CADASTRO / EDIÇÃO DE PRODUTO                           */}
      {/* ============================================================== */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: 'var(--text-main)' }}>
                {editingProduct ? 'Editar Produto' : 'Novo Produto no Estoque'}
              </h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setIsFormOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome do Produto / Descrição *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Arroz Tipo 1 - 5kg"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Código / SKU</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: PROD-001"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Categoria</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: Alimentos, Bebidas..."
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Preço de Custo (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="0.00"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preço de Venda (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="0.00"
                      value={formData.sale_price}
                      onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Quantidade Inicial</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estoque Mínimo</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.min_stock}
                      onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unidade</label>
                    <select
                      className="form-control"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      <option value="un">un (Unidade)</option>
                      <option value="pct">pct (Pacote)</option>
                      <option value="cx">cx (Caixa)</option>
                      <option value="kg">kg (Quilo)</option>
                      <option value="lt">lt (Litro)</option>
                      <option value="mt">mt (Metro)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar no Estoque'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: AJUSTE RÁPIDO DE ENTRADA OU SAÍDA                      */}
      {/* ============================================================== */}
      {adjustModal.open && (
        <div className="modal-overlay" onClick={() => setAdjustModal({ ...adjustModal, open: false })}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: 'var(--text-main)' }}>
                {adjustModal.type === 'entrada' ? '➕ Entrada de Estoque' : '➖ Saída de Estoque'}
              </h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setAdjustModal({ ...adjustModal, open: false })}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment}>
              <div className="modal-body">
                <p style={{ fontSize: '0.9rem', marginBottom: '14px', color: 'var(--text-secondary)' }}>
                  Produto: <strong>{adjustModal.product?.name}</strong><br />
                  Estoque atual: <strong>{adjustModal.product?.stock_quantity} {adjustModal.product?.unit}</strong>
                </p>

                <div className="form-group">
                  <label className="form-label">Quantidade a {adjustModal.type === 'entrada' ? 'Adicionar' : 'Remover'} *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder="Ex: 10"
                    autoFocus
                    value={adjustModal.quantity}
                    onChange={(e) => setAdjustModal({ ...adjustModal, quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Motivo / Documento</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={adjustModal.type === 'entrada' ? 'Ex: NF 4590 do Fornecedor' : 'Ex: Avaria, vencimento ou consumo interno'}
                    value={adjustModal.reason}
                    onChange={(e) => setAdjustModal({ ...adjustModal, reason: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAdjustModal({ ...adjustModal, open: false })}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar {adjustModal.type === 'entrada' ? 'Entrada' : 'Saída'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
