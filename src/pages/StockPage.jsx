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
    unit: 'un',
    package_units: '1',
    package_count: ''
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
      unit: 'un',
      package_units: '1',
      package_count: ''
    });
    setIsFormOpen(true);
  };

  // Abrir modal de edição
  const handleEdit = (prod) => {
    setEditingProduct(prod);
    const pkgUnits = Number(prod.package_units) || 1;
    const currentTotalUnits = Number(prod.stock_quantity) || 0;
    const pkgCount = pkgUnits > 1 ? Math.floor(currentTotalUnits / pkgUnits).toString() : '';

    setFormData({
      name: prod.name || '',
      sku: prod.sku || '',
      category: prod.category || '',
      cost_price: prod.cost_price || '',
      sale_price: prod.sale_price || '',
      stock_quantity: prod.stock_quantity || '0',
      min_stock: prod.min_stock || '5',
      unit: prod.unit || 'un',
      package_units: (prod.package_units || 1).toString(),
      package_count: pkgCount
    });
    setIsFormOpen(true);
  };

  // Salvar Produto
  const handleSaveProduct = async (e) => {
    e.preventDefault();

    const isPkg = formData.unit === 'pct' || formData.unit === 'cx';
    const pkgUnits = isPkg ? (Number(formData.package_units) || 1) : 1;

    // Se informou pacotes, calcula o estoque total em unidades base
    let calculatedStock = Number(formData.stock_quantity) || 0;
    if (isPkg && formData.package_count !== '') {
      calculatedStock = (Number(formData.package_count) || 0) * pkgUnits;
    }

    const payload = {
      ...formData,
      package_units: pkgUnits,
      stock_quantity: calculatedStock
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, payload);
    } else {
      await addProduct(payload);
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
    const rawQty = Number(adjustModal.quantity);
    if (!rawQty || rawQty <= 0) return;

    const prod = adjustModal.product;
    const pkgUnits = Number(prod?.package_units) || 1;
    const isSellingInPackages = adjustModal.unitType === 'pct' && pkgUnits > 1;

    // Converte pacotes para unidades base caso tenha selecionado pacotes
    const effectiveUnits = isSellingInPackages ? rawQty * pkgUnits : rawQty;
    const delta = adjustModal.type === 'entrada' ? effectiveUnits : -effectiveUnits;

    const unitLabel = isSellingInPackages 
      ? `${rawQty} ${prod.unit === 'cx' ? 'cx' : 'pct'} (${effectiveUnits} un)` 
      : `${rawQty} un`;

    await adjustStock(
      prod.id, 
      delta, 
      adjustModal.reason || `${adjustModal.type === 'entrada' ? 'Entrada' : 'Baixa'} de ${unitLabel}`
    );

    setAdjustModal({ open: false, product: null, type: 'entrada', quantity: '', unitType: 'un', reason: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Abas Superiores: Estoque Atual vs Histórico de Movimentações */}
      <div className="page-top-bar" style={{
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
          <div className="page-filters-bar" style={{
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
                            {(() => {
                              const pkgUnits = Number(prod.package_units) || 1;
                              const isPkg = (prod.unit === 'pct' || prod.unit === 'cx' || pkgUnits > 1);

                              if (isPkg && pkgUnits > 1) {
                                const fullPkgs = Math.floor(qty / pkgUnits);
                                const remUnits = qty % pkgUnits;
                                return (
                                  <div>
                                    <div style={{
                                      fontWeight: 800,
                                      fontSize: '1rem',
                                      color: isOut ? 'var(--danger-text)' : isLow ? 'var(--warning-text)' : 'var(--success-text)'
                                    }}>
                                      {qty} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>unidades</span>
                                    </div>
                                    <div style={{
                                      fontSize: '0.76rem',
                                      fontWeight: 700,
                                      color: isOut ? 'var(--danger-text)' : 'var(--primary-text)',
                                      marginTop: '2px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      <span>📦</span>
                                      <span>
                                        {fullPkgs} {prod.unit === 'cx' ? 'cx' : 'pct'}{remUnits > 0 ? ` e ${remUnits} un` : ' fechado(s)'}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                                      Mín: {min} un ({Math.ceil(min / pkgUnits)} {prod.unit === 'cx' ? 'cx' : 'pct'})
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div>
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
                                </div>
                              );
                            })()}
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

                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

                {/* Linha: Unidade de Medida & Estoque Mínimo */}
                <div className="form-grid-2">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Unidade de Medida *</label>
                    <select
                      className="form-control"
                      value={formData.unit}
                      onChange={(e) => {
                        const newUnit = e.target.value;
                        const isPkg = newUnit === 'pct' || newUnit === 'cx';
                        setFormData(prev => ({
                          ...prev,
                          unit: newUnit,
                          package_units: isPkg && (!prev.package_units || prev.package_units === '1') ? '20' : (isPkg ? prev.package_units : '1')
                        }));
                      }}
                    >
                      <option value="un">un (Unidade Avulsa)</option>
                      <option value="pct">pct (Pacote)</option>
                      <option value="cx">cx (Caixa)</option>
                      <option value="kg">kg (Quilo)</option>
                      <option value="lt">lt (Litro)</option>
                      <option value="mt">mt (Metro)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Estoque Mínimo (Alerta)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="Ex: 5"
                      value={formData.min_stock}
                      onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                    />
                  </div>
                </div>

                {/* ABA / BOX CONDICIONAL: CONFIGURAÇÃO DE PACOTE OU CAIXA */}
                {(formData.unit === 'pct' || formData.unit === 'cx') && (
                  <div style={{
                    padding: '14px 16px',
                    background: 'var(--primary-light)',
                    border: '1px solid var(--primary-border)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-text)', fontWeight: 700, fontSize: '0.88rem' }}>
                        <Package size={17} /> Configuração do {formData.unit === 'cx' ? 'Caixa' : 'Pacote'}
                      </div>
                      <span style={{ fontSize: '0.74rem', background: '#ffffff', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--primary-border)', color: 'var(--primary-text)', fontWeight: 600 }}>
                        Conversão Automática
                      </span>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Quantas unidades vêm no {formData.unit === 'cx' ? 'caixa' : 'pacote'}? *</label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          className="form-control"
                          placeholder="Ex: 20"
                          value={formData.package_units}
                          onChange={(e) => {
                            const pkgU = e.target.value;
                            setFormData(prev => {
                              const pCount = Number(prev.package_count || 0);
                              const uPerPkg = Number(pkgU || 1);
                              return {
                                ...prev,
                                package_units: pkgU,
                                stock_quantity: pCount > 0 ? (pCount * uPerPkg).toString() : prev.stock_quantity
                              };
                            });
                          }}
                          required
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Estoque Inicial ({formData.unit === 'cx' ? 'Caixas' : 'Pacotes'})</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="form-control"
                          placeholder="Ex: 5"
                          value={formData.package_count}
                          onChange={(e) => {
                            const count = e.target.value;
                            const pkgUnits = Number(formData.package_units) || 1;
                            setFormData(prev => ({
                              ...prev,
                              package_count: count,
                              stock_quantity: (Number(count || 0) * pkgUnits).toString()
                            }));
                          }}
                        />
                      </div>
                    </div>

                    <div style={{
                      fontSize: '0.82rem',
                      background: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--primary-border)',
                      color: 'var(--text-main)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <span>
                        📦 <strong>Estoque Total:</strong> {formData.package_count || 0} {formData.unit === 'cx' ? 'caixa(s)' : 'pacote(s)'} × {formData.package_units || 1} un = <strong style={{ color: 'var(--primary-text)' }}>{Number(formData.stock_quantity) || 0} unidades</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Preços */}
                <div className="form-grid-2">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Preço de Custo da Unidade (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="0.00"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Preço de Venda da Unidade (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="0.00"
                      value={formData.sale_price}
                      onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                      required
                    />
                    {(formData.unit === 'pct' || formData.unit === 'cx') && Number(formData.package_units) > 1 && Number(formData.sale_price) > 0 && (
                      <div style={{ fontSize: '0.74rem', color: 'var(--primary-text)', fontWeight: 600, marginTop: '3px' }}>
                        💰 Pacote completo sai por: R$ {(Number(formData.sale_price) * Number(formData.package_units)).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quantidade Inicial manual para produtos normais */}
                {formData.unit !== 'pct' && formData.unit !== 'cx' && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Quantidade Inicial em Estoque ({formData.unit}) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="Ex: 50"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      required
                    />
                  </div>
                )}
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
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: 'var(--text-main)' }}>
                {adjustModal.type === 'entrada' ? '➕ Entrada de Estoque' : '➖ Saída de Estoque'}
              </h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setAdjustModal({ ...adjustModal, open: false })}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {(() => {
                  const prod = adjustModal.product;
                  const pkgUnits = Number(prod?.package_units) || 1;
                  const curUnits = Number(prod?.stock_quantity) || 0;
                  const isPkg = (prod?.unit === 'pct' || prod?.unit === 'cx' || pkgUnits > 1);

                  return (
                    <div style={{
                      padding: '12px 14px',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.86rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <div>Produto: <strong style={{ color: 'var(--text-main)' }}>{prod?.name}</strong></div>
                      <div style={{ marginTop: '2px' }}>
                        Estoque atual: <strong style={{ color: 'var(--text-main)' }}>{curUnits} unidades</strong>
                        {isPkg && pkgUnits > 1 && (
                          <span style={{ color: 'var(--primary-text)', fontWeight: 600, marginLeft: '6px' }}>
                            ({Math.floor(curUnits / pkgUnits)} {prod.unit === 'cx' ? 'cx' : 'pct'} e {curUnits % pkgUnits} un)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Alternador de Unidade vs Pacote no Ajuste */}
                {(() => {
                  const prod = adjustModal.product;
                  const pkgUnits = Number(prod?.package_units) || 1;
                  const isPkg = (prod?.unit === 'pct' || prod?.unit === 'cx' || pkgUnits > 1);

                  if (!isPkg || pkgUnits <= 1) return null;

                  return (
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Ajustar por:</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            background: adjustModal.unitType === 'un' ? 'var(--primary-light)' : '#ffffff',
                            border: `1px solid ${adjustModal.unitType === 'un' ? 'var(--primary-border)' : 'var(--border-subtle)'}`,
                            color: adjustModal.unitType === 'un' ? 'var(--primary-text)' : 'var(--text-muted)',
                            fontWeight: adjustModal.unitType === 'un' ? 700 : 500
                          }}
                          onClick={() => setAdjustModal(prev => ({ ...prev, unitType: 'un' }))}
                        >
                          Unidades Avulsas
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            background: adjustModal.unitType === 'pct' ? 'var(--primary-light)' : '#ffffff',
                            border: `1px solid ${adjustModal.unitType === 'pct' ? 'var(--primary-border)' : 'var(--border-subtle)'}`,
                            color: adjustModal.unitType === 'pct' ? 'var(--primary-text)' : 'var(--text-muted)',
                            fontWeight: adjustModal.unitType === 'pct' ? 700 : 500
                          }}
                          onClick={() => setAdjustModal(prev => ({ ...prev, unitType: 'pct' }))}
                        >
                          {prod.unit === 'cx' ? 'Caixas' : 'Pacotes'} ({pkgUnits} un)
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">
                    {adjustModal.unitType === 'pct' 
                      ? `Quantidade de ${adjustModal.product?.unit === 'cx' ? 'Caixas' : 'Pacotes'} a ${adjustModal.type === 'entrada' ? 'Adicionar' : 'Remover'} *`
                      : `Quantidade de Unidades a ${adjustModal.type === 'entrada' ? 'Adicionar' : 'Remover'} *`}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder="Ex: 5"
                    autoFocus
                    value={adjustModal.quantity}
                    onChange={(e) => setAdjustModal({ ...adjustModal, quantity: e.target.value })}
                    required
                  />
                  {adjustModal.unitType === 'pct' && Number(adjustModal.quantity) > 0 && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--primary-text)', fontWeight: 600, marginTop: '4px' }}>
                      💡 Equivale a {Number(adjustModal.quantity) * (Number(adjustModal.product?.package_units) || 1)} unidades no estoque.
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Motivo / Documento</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={adjustModal.type === 'entrada' ? 'Ex: NF do Fornecedor' : 'Ex: Avaria, vencimento ou consumo'}
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
