import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  PlusCircle,
  Building2,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const Sidebar = ({ activeTab, setActiveTab, onOpenNewSale, mobileOpen, setMobileOpen }) => {
  const { currentCompany } = useAuth();
  const { dashboardStats } = useData();

  const navItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { 
      id: 'clients', 
      label: 'Painel de Clientes', 
      icon: Users, 
      badge: dashboardStats.customersWithDebt > 0 ? `${dashboardStats.customersWithDebt} devendo` : null,
      badgeColor: 'badge-danger'
    },
    { 
      id: 'stock', 
      label: 'Estoque & Produtos', 
      icon: Package, 
      badge: dashboardStats.lowStockCount > 0 ? `${dashboardStats.lowStockCount} baixo` : null,
      badgeColor: 'badge-warning'
    },
    { id: 'sales', label: 'Vendas & Gastos', icon: ShoppingCart },
  ];

  return (
    <>
      {/* Overlay Mobile */}
      {mobileOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Brand Header com a Empresa do Usuário e Foto */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
            {currentCompany?.logo ? (
              <img 
                src={currentCompany.logo} 
                alt={currentCompany.trade_name || currentCompany.name}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  objectFit: 'contain',
                  background: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-xs)',
                  flexShrink: 0
                }}
              />
            ) : (
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
                flexShrink: 0
              }}>
                <Building2 size={22} color="#ffffff" />
              </div>
            )}

            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ 
                fontSize: '1.02rem', 
                fontWeight: 800, 
                letterSpacing: '-0.02em', 
                color: 'var(--text-main)',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}>
                {currentCompany?.trade_name || currentCompany?.name || 'Gerencie'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Gestão de Clientes & Estoque
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-icon sidebar-close-btn"
            onClick={() => setMobileOpen(false)}
            title="Fechar menu"
          >
            <X size={16} />
          </button>
        </div>


        {/* Action Button: Lançar Venda */}
        <div style={{ padding: '16px 20px 8px' }}>
          <button 
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '0.88rem' }}
            onClick={onOpenNewSale}
          >
            <PlusCircle size={17} /> Nova Venda / Gasto
          </button>
        </div>

        {/* Navigation Links */}
        <nav style={{ padding: '8px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: isActive ? '1px solid var(--primary-border)' : '1px solid transparent',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? 'var(--primary-text)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.9rem',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-subtle)';
                    e.currentTarget.style.color = 'var(--text-main)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={18} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`badge ${item.badgeColor}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
