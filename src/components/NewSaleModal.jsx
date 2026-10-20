import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Trash2, X, CheckCircle, User, Package, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useData } from '../context/DataContext';

export const NewSaleModal = ({ isOpen, onClose, initialCustomer }) => {
  const { customers, products, addSale } = useData();

  const [customerId, setCustomerId] = useState(initialCustomer?.id || '');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('a_prazo');
  const [paymentType, setPaymentType] = useState('devendo'); // 'pago', 'devendo', 'parcial'
  const [paidInput, setPaidInput] = useState('0');
  const [notes, setNotes] = useState('');

  // Itens da venda
  const [items, setItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [sellUnitType, setSellUnitType] = useState('un'); // 'un' ou 'pct'

  useEffect(() => {
    if (isOpen) {
      setCustomerId(initialCustomer?.id || '');
      setItems([]);
      setSelectedProductId('');
      setItemQuantity('1');
      setSellUnitType('un');
      setNotes('');
      setPaidInput('0');
      setPaymentType('devendo');
      setPaymentMethod('a_prazo');
    }
  }, [isOpen, initialCustomer]);

  if (!isOpen) return null;

  // Adicionar item do estoque
  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const rawQty = Number(itemQuantity) || 1;
    const pkgUnits = Number(prod.package_units) || 1;
    const isSellingByPackage = sellUnitType === 'pct' && pkgUnits > 1;

    // Quantidade real que sai do estoque (em unidades base)
    const effectiveQuantity = isSellingByPackage ? rawQty * pkgUnits : rawQty;
    const unitPrice = Number(prod.sale_price) || 0;
    const subtotal = effectiveQuantity * unitPrice;

    const displayName = isSellingByPackage
      ? `${prod.name} (${rawQty} ${prod.unit === 'cx' ? 'cx' : 'pct'} c/ ${pkgUnits} un = ${effectiveQuantity} un)`
      : `${prod.name} (${effectiveQuantity} un)`;

    const newItem = {
      product_id: prod.id,
      product_name: prod.name,
      display_name: displayName,
      quantity: effectiveQuantity,
      unit_price: unitPrice,
      subtotal,
      unit: prod.unit
    };

    setItems([...items, newItem]);
    setSelectedProductId('');
    setItemQuantity('1');
    setSellUnitType('un');
  };

  // Remover item
  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Total da compra
  const totalAmount = items.reduce((acc, it) => acc + it.subtotal, 0);

  // Valor pago e devido
  let finalPaid = 0;
  if (paymentType === 'pago') {
    finalPaid = totalAmount;
  } else if (paymentType === 'parcial') {
    finalPaid = Math.min(totalAmount, Number(paidInput) || 0);
  }

  const finalDue = Math.max(0, totalAmount - finalPaid);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let finalItems = [...items];
    // Se o usuário selecionou um produto mas não clicou no botão "Adicionar", inclui automaticamente
    if (selectedProductId) {
      const prod = products.find(p => p.id === selectedProductId);
      if (prod) {
        const rawQty = Number(itemQuantity) || 1;
        const pkgUnits = Number(prod.package_units) || 1;
        const isSellingByPackage = sellUnitType === 'pct' && pkgUnits > 1;
        const effectiveQuantity = isSellingByPackage ? rawQty * pkgUnits : rawQty;
        const unitPrice = Number(prod.sale_price) || 0;
        const subtotal = effectiveQuantity * unitPrice;
        const displayName = isSellingByPackage
          ? `${prod.name} (${rawQty} ${prod.unit === 'cx' ? 'cx' : 'pct'} c/ ${pkgUnits} un = ${effectiveQuantity} un)`
          : `${prod.name} (${effectiveQuantity} un)`;

        finalItems.push({
          product_id: prod.id,
          product_name: prod.name,
          display_name: displayName,
          quantity: effectiveQuantity,
          unit_price: unitPrice,
          subtotal,
          unit: prod.unit
        });
      }
    }

    if (finalItems.length === 0) {
      alert('Adicione pelo menos um produto ou item à venda.');
      return;
    }

    const calculatedTotal = finalItems.reduce((acc, it) => acc + it.subtotal, 0);
    let calculatedPaid = 0;
    if (paymentType === 'pago') {
      calculatedPaid = calculatedTotal;
    } else if (paymentType === 'parcial') {
      calculatedPaid = Math.min(calculatedTotal, Number(paidInput) || 0);
    }

    await addSale({
      customer_id: customerId || null,
      items: finalItems,
      total_amount: calculatedTotal,
      paid_amount: calculatedPaid,
      payment_method: paymentMethod,
      notes,
      sale_date: saleDate
    });

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <ShoppingCart size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)' }}>Lançar Nova Venda / Compra</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Registra o gasto do cliente e dá baixa automática no estoque
              </div>
            </div>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Linha 1: Cliente & Data */}
            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Cliente *</label>
                <select
                  className="form-control"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">Cliente Balcão / Avulso</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.total_debt > 0 ? `(Devendo R$ ${c.total_debt.toFixed(2)})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Data da Compra</label>
                <input
                  type="date"
                  className="form-control"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Linha 2: Adicionar Itens do Estoque */}
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Adicionar Produtos à Compra
              </div>

              {/* Seletor de Modo de Venda (se o produto for pacote / caixa) */}
              {(() => {
                const prod = products.find(p => p.id === selectedProductId);
                const pkgUnits = Number(prod?.package_units) || 1;
                const isPkg = prod && (prod.unit === 'pct' || prod.unit === 'cx' || pkgUnits > 1);

                if (!isPkg || pkgUnits <= 1) return null;

                return (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: '#ffffff',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--primary-border)',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-text)' }}>
                      📦 Produto em {prod.unit === 'cx' ? 'Caixa' : 'Pacote'} (vem {pkgUnits} un):
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.78rem',
                          background: sellUnitType === 'un' ? 'var(--primary-light)' : 'transparent',
                          border: `1px solid ${sellUnitType === 'un' ? 'var(--primary-border)' : 'var(--border-subtle)'}`,
                          color: sellUnitType === 'un' ? 'var(--primary-text)' : 'var(--text-muted)',
                          fontWeight: sellUnitType === 'un' ? 700 : 500
                        }}
                        onClick={() => setSellUnitType('un')}
                      >
                        Vender por Unidade
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.78rem',
                          background: sellUnitType === 'pct' ? 'var(--primary-light)' : 'transparent',
                          border: `1px solid ${sellUnitType === 'pct' ? 'var(--primary-border)' : 'var(--border-subtle)'}`,
                          color: sellUnitType === 'pct' ? 'var(--primary-text)' : 'var(--text-muted)',
                          fontWeight: sellUnitType === 'pct' ? 700 : 500
                        }}
                        onClick={() => setSellUnitType('pct')}
                      >
                        Vender por {prod.unit === 'cx' ? 'Caixa' : 'Pacote'} ({pkgUnits} un)
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: '200px' }}>
                  <select
                    className="form-control"
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      setSellUnitType('un');
                      setItemQuantity('1');
                    }}
                  >
                    <option value="">Selecione o produto do estoque...</option>
                    {products.map(p => {
                      const pUnits = Number(p.package_units) || 1;
                      const totU = Number(p.stock_quantity) || 0;
                      const fullP = Math.floor(totU / pUnits);
                      const remU = totU % pUnits;

                      const dispInfo = pUnits > 1
                        ? `${totU} un (${fullP} ${p.unit === 'cx' ? 'cx' : 'pct'}${remU > 0 ? ` e ${remU} un` : ''})`
                        : `${totU} ${p.unit}`;

                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} - R$ {Number(p.sale_price).toFixed(2)}/un (disp: {dispInfo})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div style={{ width: '110px' }}>
                  {(() => {
                    const prod = products.find(p => p.id === selectedProductId);
                    const pkgUnits = Number(prod?.package_units) || 1;
                    const isPkg = prod && (prod.unit === 'pct' || prod.unit === 'cx' || pkgUnits > 1);

                    return (
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="form-control"
                        placeholder={isPkg && sellUnitType === 'pct' ? 'Qtd Pcts' : 'Qtd Un'}
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                      />
                    );
                  })()}
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddItem}
                >
                  <Plus size={15} /> Adicionar
                </button>
              </div>

              {/* Dica da quantidade total se estiver vendendo em pacotes */}
              {(() => {
                const prod = products.find(p => p.id === selectedProductId);
                const pkgUnits = Number(prod?.package_units) || 1;
                const isPkg = prod && (prod.unit === 'pct' || prod.unit === 'cx' || pkgUnits > 1);

                if (!isPkg || sellUnitType !== 'pct' || !itemQuantity || Number(itemQuantity) <= 0) return null;

                const totalUnits = Number(itemQuantity) * pkgUnits;
                const totalCost = totalUnits * Number(prod.sale_price);

                return (
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'var(--primary-text)',
                    fontWeight: 600,
                    padding: '6px 10px',
                    background: '#ffffff',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px dashed var(--primary-border)'
                  }}>
                    💡 {itemQuantity} {prod.unit === 'cx' ? 'caixas' : 'pacotes'} = <strong>{totalUnits} unidades</strong> saindo do estoque (Subtotal: <strong>R$ {totalCost.toFixed(2)}</strong>)
                  </div>
                );
              })()}

              {/* Lista de Itens Adicionados */}
              {items.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        background: '#ffffff',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div style={{ color: 'var(--text-main)' }}>
                        <strong>{it.display_name || `${it.quantity}x ${it.product_name}`}</strong>{' '}
                        <span style={{ color: 'var(--text-muted)' }}>
                          (R$ {it.unit_price.toFixed(2)} / un)
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary-text)' }}>
                          R$ {it.subtotal.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          className="btn btn-danger btn-icon"
                          style={{ width: '28px', height: '28px' }}
                          onClick={() => handleRemoveItem(idx)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Linha 3: Total & Condição de Pagamento */}
            <div style={{
              background: 'var(--primary-light)',
              border: '1px solid var(--primary-border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Valor Total dos Produtos:</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  R$ {totalAmount.toFixed(2)}
                </span>
              </div>

              {/* Status do Pagamento (Pago vs Fiado / Devendo) */}
              <div className="payment-type-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    background: paymentType === 'pago' ? 'var(--success-light)' : '#ffffff',
                    border: `1px solid ${paymentType === 'pago' ? 'var(--success-border)' : 'var(--border-subtle)'}`,
                    color: paymentType === 'pago' ? 'var(--success-text)' : 'var(--text-muted)',
                    fontWeight: paymentType === 'pago' ? 700 : 500
                  }}
                  onClick={() => setPaymentType('pago')}
                >
                  Totalmente Pago
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    background: paymentType === 'devendo' ? 'var(--danger-light)' : '#ffffff',
                    border: `1px solid ${paymentType === 'devendo' ? 'var(--danger-border)' : 'var(--border-subtle)'}`,
                    color: paymentType === 'devendo' ? 'var(--danger-text)' : 'var(--text-muted)',
                    fontWeight: paymentType === 'devendo' ? 700 : 500
                  }}
                  onClick={() => setPaymentType('devendo')}
                >
                  A Prazo / Fiado
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    background: paymentType === 'parcial' ? 'var(--warning-light)' : '#ffffff',
                    border: `1px solid ${paymentType === 'parcial' ? 'var(--warning-border)' : 'var(--border-subtle)'}`,
                    color: paymentType === 'parcial' ? 'var(--warning-text)' : 'var(--text-muted)',
                    fontWeight: paymentType === 'parcial' ? 700 : 500
                  }}
                  onClick={() => setPaymentType('parcial')}
                >
                  Entrada Parcial
                </button>
              </div>

              {/* Input de entrada se for parcial */}
              {paymentType === 'parcial' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Valor Pago de Entrada (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    style={{ maxWidth: '140px' }}
                    value={paidInput}
                    onChange={(e) => setPaidInput(e.target.value)}
                  />
                </div>
              )}

              {/* Resumo de Dívida */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                <span>Valor Pago: <strong style={{ color: 'var(--success-text)' }}>R$ {finalPaid.toFixed(2)}</strong></span>
                <span>Cliente Fica Devendo: <strong style={{ color: finalDue > 0 ? 'var(--danger-text)' : 'var(--text-muted)' }}>R$ {finalDue.toFixed(2)}</strong></span>
              </div>
            </div>

            {/* Forma de Pagamento e Observações */}
            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Forma de Pagamento</label>
                <select
                  className="form-control"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="a_prazo">A Prazo / Fiado</option>
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Observações da Venda</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Acerto para o dia 20..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={items.length === 0}>
              Finalizar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
