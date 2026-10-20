import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { getSupabaseClient, getSupabaseConfig } from '../lib/supabase';
import { 
  INITIAL_CUSTOMERS, 
  INITIAL_PRODUCTS, 
  INITIAL_SALES, 
  INITIAL_STOCK_MOVEMENTS 
} from '../lib/mockData';

const DataContext = createContext();

// Gerador de UUID seguro para Postgres
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const DataProvider = ({ children }) => {
  const { currentCompany } = useAuth();
  const companyId = currentCompany?.id || '00000000-0000-0000-0000-000000000001';

  // Estados brutos
  const [allCustomers, setAllCustomers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [allSales, setAllSales] = useState([]);
  const [allMovements, setAllMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados locais ou remotos
  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId]);

  const loadData = async () => {
    setLoading(true);
    const { isConfigured } = getSupabaseConfig();
    const supabase = getSupabaseClient();

    let loadedCustomers = [];
    let loadedProducts = [];
    let loadedSales = [];
    let loadedMovements = [];
    let fetchedFromSupabase = false;

    // Tenta carregar do Supabase se configurado
    if (isConfigured && supabase && companyId) {
      try {
        const [custRes, prodRes, salesRes, movRes] = await Promise.all([
          supabase.from('customers').select('*').eq('company_id', companyId),
          supabase.from('products').select('*').eq('company_id', companyId),
          supabase.from('sales').select('*, items:sale_items(*)').eq('company_id', companyId).order('sale_date', { ascending: false }),
          supabase.from('stock_movements').select('*').eq('company_id', companyId).order('created_at', { ascending: false })
        ]);

        if (!custRes.error) {
          loadedCustomers = custRes.data || [];
          fetchedFromSupabase = true;
        }
        if (!prodRes.error) {
          loadedProducts = prodRes.data || [];
          fetchedFromSupabase = true;
        }
        if (!salesRes.error) {
          loadedSales = salesRes.data || [];
          fetchedFromSupabase = true;
        }
        if (!movRes.error) {
          loadedMovements = movRes.data || [];
          fetchedFromSupabase = true;
        }
      } catch (err) {
        console.warn('Erro ao consultar Supabase, utilizando dados locais persistidos:', err);
      }
    }

    // Se não carregou do Supabase (offline ou não configurado), usa LocalStorage / Mock
    if (!fetchedFromSupabase) {
      const savedCust = localStorage.getItem('gerencie_customers');
      loadedCustomers = savedCust ? JSON.parse(savedCust) : INITIAL_CUSTOMERS;

      const savedProd = localStorage.getItem('gerencie_products');
      loadedProducts = savedProd ? JSON.parse(savedProd) : INITIAL_PRODUCTS;

      const savedSales = localStorage.getItem('gerencie_sales');
      loadedSales = savedSales ? JSON.parse(savedSales) : INITIAL_SALES;

      const savedMov = localStorage.getItem('gerencie_movements');
      loadedMovements = savedMov ? JSON.parse(savedMov) : INITIAL_STOCK_MOVEMENTS;
    }

    setAllCustomers(loadedCustomers);
    setAllProducts(loadedProducts);
    setAllSales(loadedSales);
    setAllMovements(loadedMovements);
    setLoading(false);
  };

  // Salvar no LocalStorage sempre que alterar
  const persistCustomers = (data) => {
    setAllCustomers(data);
    localStorage.setItem('gerencie_customers', JSON.stringify(data));
  };

  const persistProducts = (data) => {
    setAllProducts(data);
    localStorage.setItem('gerencie_products', JSON.stringify(data));
  };

  const persistSales = (data) => {
    setAllSales(data);
    localStorage.setItem('gerencie_sales', JSON.stringify(data));
  };

  const persistMovements = (data) => {
    setAllMovements(data);
    localStorage.setItem('gerencie_movements', JSON.stringify(data));
  };

  // Filtros isolados pela Empresa
  const currentSales = useMemo(() => {
    return allSales.filter(s => !s.company_id || s.company_id === companyId);
  }, [allSales, companyId]);

  const currentProducts = useMemo(() => {
    return allProducts.filter(p => !p.company_id || p.company_id === companyId);
  }, [allProducts, companyId]);

  const currentMovements = useMemo(() => {
    return allMovements.filter(m => !m.company_id || m.company_id === companyId);
  }, [allMovements, companyId]);

  // Clientes da empresa com métricas calculadas em tempo real!
  const currentCustomers = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const companyCustomers = allCustomers.filter(c => !c.company_id || c.company_id === companyId);

    return companyCustomers.map(customer => {
      const customerSales = currentSales.filter(s => s.customer_id === customer.id);

      let totalSpent = 0;
      let monthSpent = 0;
      let totalDebt = 0;
      let totalPaid = 0;
      let lastPurchaseDate = null;

      customerSales.forEach(sale => {
        const amount = Number(sale.total_amount) || 0;
        const due = Number(sale.due_amount) || 0;
        const paid = Number(sale.paid_amount) || 0;

        totalSpent += amount;
        totalDebt += due;
        totalPaid += paid;

        // Verificar se é do mês atual
        if (sale.sale_date) {
          const [sYear, sMonth] = sale.sale_date.split('-').map(Number);
          if (sYear === currentYear && (sMonth - 1) === currentMonth) {
            monthSpent += amount;
          }

          if (!lastPurchaseDate || new Date(sale.sale_date) > new Date(lastPurchaseDate)) {
            lastPurchaseDate = sale.sale_date;
          }
        }
      });

      return {
        ...customer,
        total_spent: totalSpent,
        month_spent: monthSpent,
        total_debt: totalDebt,
        total_paid: totalPaid,
        sales_count: customerSales.length,
        last_purchase_date: lastPurchaseDate,
        status: totalDebt > 0 ? 'devedor' : 'em_dia'
      };
    });
  }, [allCustomers, currentSales, companyId]);

  // ==================== OPERAÇÕES DE CLIENTES ====================
  const addCustomer = async (custData) => {
    const newCustomer = {
      id: generateUUID(),
      company_id: companyId,
      name: custData.name,
      phone: custData.phone || '',
      email: custData.email || '',
      document: custData.document || '',
      address: custData.address || '',
      notes: custData.notes || '',
      credit_limit: Number(custData.credit_limit) || 0,
      created_at: new Date().toISOString()
    };

    persistCustomers([newCustomer, ...allCustomers]);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('customers').insert([newCustomer]);
      } catch (e) {
        console.warn('Erro ao salvar no Supabase:', e);
      }
    }

    return newCustomer;
  };

  const updateCustomer = async (id, updatedFields) => {
    const updated = allCustomers.map(c => c.id === id ? { ...c, ...updatedFields } : c);
    persistCustomers(updated);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('customers').update(updatedFields).eq('id', id);
      } catch (e) {
        console.warn('Erro ao atualizar no Supabase:', e);
      }
    }
  };

  const deleteCustomer = async (id) => {
    const filtered = allCustomers.filter(c => c.id !== id);
    persistCustomers(filtered);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('customers').delete().eq('id', id);
      } catch (e) {
        console.warn('Erro ao deletar no Supabase:', e);
      }
    }
  };

  // ==================== OPERAÇÕES DE PRODUTOS / ESTOQUE ====================
  const addProduct = async (prodData) => {
    const newProd = {
      id: generateUUID(),
      company_id: companyId,
      name: prodData.name,
      sku: prodData.sku || ('SKU-' + Math.floor(1000 + Math.random() * 9000)),
      category: prodData.category || 'Geral',
      cost_price: Number(prodData.cost_price) || 0,
      sale_price: Number(prodData.sale_price) || 0,
      stock_quantity: Number(prodData.stock_quantity) || 0,
      min_stock: Number(prodData.min_stock) || 5,
      unit: prodData.unit || 'un',
      package_units: Number(prodData.package_units) || 1,
      is_active: true,
      created_at: new Date().toISOString()
    };

    const updated = [newProd, ...allProducts];
    persistProducts(updated);

    if (newProd.stock_quantity > 0) {
      addStockMovement({
        product_id: newProd.id,
        movement_type: 'entrada',
        quantity: newProd.stock_quantity,
        previous_stock: 0,
        new_stock: newProd.stock_quantity,
        reason: 'Cadastro inicial de estoque'
      });
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('products').insert([newProd]);
      } catch (e) {
        if (e?.message && e.message.includes('package_units')) {
          const { package_units, ...withoutPkg } = newProd;
          await supabase.from('products').insert([withoutPkg]).catch(err => console.warn('Erro retry sem package_units:', err));
        } else {
          console.warn('Erro ao salvar produto no Supabase:', e);
        }
      }
    }

    return newProd;
  };

  const updateProduct = async (id, updatedFields) => {
    const updated = allProducts.map(p => p.id === id ? { ...p, ...updatedFields } : p);
    persistProducts(updated);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('products').update(updatedFields).eq('id', id);
      } catch (e) {
        if (e?.message && e.message.includes('package_units')) {
          const { package_units, ...withoutPkg } = updatedFields;
          await supabase.from('products').update(withoutPkg).eq('id', id).catch(err => console.warn('Erro retry sem package_units:', err));
        } else {
          console.warn('Erro ao atualizar produto no Supabase:', e);
        }
      }
    }
  };

  const adjustStock = async (productId, deltaQuantity, reason = 'Ajuste manual') => {
    const prod = allProducts.find(p => p.id === productId);
    if (!prod) return;

    const currentQty = Number(prod.stock_quantity) || 0;
    const newQty = Math.max(0, currentQty + deltaQuantity);
    const type = deltaQuantity >= 0 ? 'entrada' : 'saida';

    await updateProduct(productId, { stock_quantity: newQty });

    addStockMovement({
      product_id: productId,
      movement_type: type,
      quantity: Math.abs(deltaQuantity),
      previous_stock: currentQty,
      new_stock: newQty,
      reason: reason
    });
  };

  const deleteProduct = async (id) => {
    const filtered = allProducts.filter(p => p.id !== id);
    persistProducts(filtered);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (e) {
        console.warn('Erro ao deletar produto no Supabase:', e);
      }
    }
  };

  const addStockMovement = async (movData) => {
    const newMov = {
      id: generateUUID(),
      company_id: companyId,
      product_id: movData.product_id,
      movement_type: movData.movement_type,
      quantity: Number(movData.quantity),
      previous_stock: Number(movData.previous_stock),
      new_stock: Number(movData.new_stock),
      reason: movData.reason || '',
      created_at: new Date().toISOString()
    };

    persistMovements([newMov, ...allMovements]);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('stock_movements').insert([newMov]);
      } catch (e) {
        console.warn('Erro ao salvar movimentação no Supabase:', e);
      }
    }
  };

  // ==================== OPERAÇÕES DE VENDAS / GASTOS / PAGAMENTOS ====================
  const addSale = async ({ customer_id, items = [], total_amount, paid_amount, payment_method, notes, sale_date }) => {
    const total = Number(total_amount);
    const paid = Number(paid_amount) || 0;
    const due = Math.max(0, total - paid);

    let payment_status = 'pendente';
    if (due === 0) {
      payment_status = 'pago';
    } else if (paid > 0 && paid < total) {
      payment_status = 'parcial';
    }

    const saleId = generateUUID();

    const newSale = {
      id: saleId,
      company_id: companyId,
      customer_id: customer_id || null,
      total_amount: total,
      paid_amount: paid,
      due_amount: due,
      payment_status,
      payment_method: payment_method || 'a_prazo',
      notes: notes || '',
      sale_date: sale_date || new Date().toISOString().split('T')[0],
      items: items.map(item => ({
        product_id: item.product_id || null,
        product_name: item.product_name,
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        subtotal: (Number(item.quantity) || 1) * (Number(item.unit_price) || 0)
      })),
      created_at: new Date().toISOString()
    };

    // 1. Baixa e subtração atômica no estoque de cada produto vendido
    let updatedProducts = [...allProducts];
    const newMovements = [];

    // Agrupa quantidades vendidas por produto para cálculo preciso
    const soldByProduct = {};
    items.forEach(it => {
      if (it.product_id) {
        soldByProduct[it.product_id] = (soldByProduct[it.product_id] || 0) + (Number(it.quantity) || 0);
      }
    });

    const supabase = getSupabaseClient();

    for (const [prodId, soldQty] of Object.entries(soldByProduct)) {
      if (soldQty <= 0) continue;
      const prod = updatedProducts.find(p => p.id === prodId);
      if (prod) {
        const curQty = Number(prod.stock_quantity) || 0;
        const newQty = Math.max(0, curQty - soldQty); // SUBTRAÇÃO DO ESTOQUE

        updatedProducts = updatedProducts.map(p => 
          p.id === prodId ? { ...p, stock_quantity: newQty } : p
        );

        newMovements.push({
          id: generateUUID(),
          company_id: companyId,
          product_id: prodId,
          movement_type: 'venda',
          quantity: soldQty,
          previous_stock: curQty,
          new_stock: newQty,
          reason: `Venda #${saleId.slice(0, 8)} para ${newSale.customer_id ? 'cliente' : 'balcão'} (${prod.name})`,
          created_at: new Date().toISOString()
        });

        // Atualiza no banco Supabase
        if (supabase) {
          try {
            await supabase.from('products').update({ stock_quantity: newQty }).eq('id', prodId);
          } catch (err) {
            console.warn('Erro ao atualizar estoque no Supabase:', err);
          }
        }
      }
    }

    if (newMovements.length > 0) {
      persistProducts(updatedProducts);
      persistMovements([...newMovements, ...allMovements]);

      if (supabase) {
        try {
          await supabase.from('stock_movements').insert(newMovements);
        } catch (err) {
          console.warn('Erro ao salvar movimentações de venda no Supabase:', err);
        }
      }
    }

    // 2. Registra a venda
    persistSales([newSale, ...allSales]);

    if (supabase) {
      try {
        await supabase.from('sales').insert([{
          id: newSale.id,
          company_id: newSale.company_id,
          customer_id: newSale.customer_id,
          total_amount: newSale.total_amount,
          paid_amount: newSale.paid_amount,
          due_amount: newSale.due_amount,
          payment_status: newSale.payment_status,
          payment_method: newSale.payment_method,
          notes: newSale.notes,
          sale_date: newSale.sale_date,
          created_at: newSale.created_at
        }]);

        if (newSale.items?.length > 0) {
          await supabase.from('sale_items').insert(
            newSale.items.map(it => ({
              id: generateUUID(),
              sale_id: newSale.id,
              product_id: it.product_id || null,
              product_name: it.product_name,
              quantity: it.quantity,
              unit_price: it.unit_price,
              subtotal: it.subtotal
            }))
          );
        }
      } catch (e) {
        console.warn('Erro ao salvar venda no Supabase:', e);
      }
    }

    return newSale;
  };

  // Dar baixa / Receber pagamento de uma conta / dívida de cliente
  const paySaleDebt = async (saleId, amountToPay) => {
    const payNum = Number(amountToPay);
    if (payNum <= 0) return;

    const updated = allSales.map(sale => {
      if (sale.id === saleId) {
        const currentDue = Number(sale.due_amount) || 0;
        const currentPaid = Number(sale.paid_amount) || 0;

        const effectivePay = Math.min(payNum, currentDue);
        const newDue = Math.max(0, currentDue - effectivePay);
        const newPaid = currentPaid + effectivePay;

        let status = 'parcial';
        if (newDue === 0) status = 'pago';

        return {
          ...sale,
          paid_amount: newPaid,
          due_amount: newDue,
          payment_status: status,
          notes: (sale.notes ? sale.notes + '\n' : '') + `[${new Date().toLocaleDateString('pt-BR')}] Recebido R$ ${effectivePay.toFixed(2)}`
        };
      }
      return sale;
    });

    persistSales(updated);

    const targetSale = updated.find(s => s.id === saleId);
    if (targetSale) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('sales').update({
            paid_amount: targetSale.paid_amount,
            due_amount: targetSale.due_amount,
            payment_status: targetSale.payment_status,
            notes: targetSale.notes
          }).eq('id', saleId);
        } catch (e) {
          console.warn('Erro ao atualizar pagamento no Supabase:', e);
        }
      }
    }
  };

  // Quitar toda a dívida de um cliente de uma vez
  const payTotalCustomerDebt = async (customerId) => {
    const clientSales = currentSales.filter(s => s.customer_id === customerId && s.due_amount > 0);
    for (const sale of clientSales) {
      await paySaleDebt(sale.id, sale.due_amount);
    }
  };

  // Excluir venda com estorno automático dos produtos no estoque
  const deleteSale = async (id) => {
    const saleToDelete = allSales.find(s => s.id === id);

    // 1. Estorna cada item vendido de volta para o estoque
    if (saleToDelete && saleToDelete.items && saleToDelete.items.length > 0) {
      // Agrupa quantidades por produto
      const returnsByProduct = {};
      saleToDelete.items.forEach(it => {
        if (it.product_id) {
          returnsByProduct[it.product_id] = (returnsByProduct[it.product_id] || 0) + (Number(it.quantity) || 0);
        }
      });

      const newMovements = [];
      let updatedProducts = [...allProducts];

      for (const [prodId, qtyToReturn] of Object.entries(returnsByProduct)) {
        if (qtyToReturn <= 0) continue;
        const prod = updatedProducts.find(p => p.id === prodId);
        if (prod) {
          const curQty = Number(prod.stock_quantity) || 0;
          const newQty = curQty + qtyToReturn;

          updatedProducts = updatedProducts.map(p => 
            p.id === prodId ? { ...p, stock_quantity: newQty } : p
          );

          newMovements.push({
            id: generateUUID(),
            company_id: companyId,
            product_id: prodId,
            movement_type: 'entrada',
            quantity: qtyToReturn,
            previous_stock: curQty,
            new_stock: newQty,
            reason: `Estorno por exclusão de venda/conta #${saleToDelete.id.slice(0, 8)} (${prod.name})`,
            created_at: new Date().toISOString()
          });

          // Atualiza quantidade do produto no Supabase
          const supabase = getSupabaseClient();
          if (supabase) {
            try {
              await supabase.from('products').update({ stock_quantity: newQty }).eq('id', prodId);
            } catch (err) {
              console.warn('Erro ao estornar estoque no Supabase:', err);
            }
          }
        }
      }

      if (newMovements.length > 0) {
        persistProducts(updatedProducts);
        persistMovements([...newMovements, ...allMovements]);

        const supabase = getSupabaseClient();
        if (supabase) {
          try {
            await supabase.from('stock_movements').insert(newMovements);
          } catch (err) {
            console.warn('Erro ao registrar movimentação de estorno no Supabase:', err);
          }
        }
      }
    }

    // 2. Remove a venda do estado e do Supabase
    const filtered = allSales.filter(s => s.id !== id);
    persistSales(filtered);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('sales').delete().eq('id', id);
      } catch (e) {
        console.warn('Erro ao deletar venda no Supabase:', e);
      }
    }
  };

  // Métricas do Dashboard Geral
  const dashboardStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthRevenue = 0;
    let totalDebt = 0;
    let monthSalesCount = 0;

    currentSales.forEach(sale => {
      totalDebt += Number(sale.due_amount) || 0;

      if (sale.sale_date) {
        const [sYear, sMonth] = sale.sale_date.split('-').map(Number);
        if (sYear === currentYear && (sMonth - 1) === currentMonth) {
          monthRevenue += Number(sale.total_amount) || 0;
          monthSalesCount++;
        }
      }
    });

    let totalInventoryValue = 0;
    let lowStockProducts = [];

    currentProducts.forEach(prod => {
      const qty = Number(prod.stock_quantity) || 0;
      const cost = Number(prod.cost_price) || 0;
      const min = Number(prod.min_stock) || 0;

      totalInventoryValue += qty * cost;

      if (qty <= min) {
        lowStockProducts.push(prod);
      }
    });

    return {
      monthRevenue,
      totalDebt,
      monthSalesCount,
      totalCustomers: currentCustomers.length,
      customersWithDebt: currentCustomers.filter(c => c.total_debt > 0).length,
      totalProducts: currentProducts.length,
      totalInventoryValue,
      lowStockCount: lowStockProducts.length,
      lowStockProducts
    };
  }, [currentSales, currentCustomers, currentProducts]);

  return (
    <DataContext.Provider
      value={{
        customers: currentCustomers,
        products: currentProducts,
        sales: currentSales,
        stockMovements: currentMovements,
        dashboardStats,
        loading,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addProduct,
        updateProduct,
        adjustStock,
        deleteProduct,
        addSale,
        paySaleDebt,
        payTotalCustomerDebt,
        deleteSale,
        refreshData: loadData
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
