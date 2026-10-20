import React from 'react';
import { Menu, LogOut, Building2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ activeTab, setMobileOpen }) => {
  const { user, currentCompany, logout, isSupabaseConnected, isMasterAdmin } = useAuth();

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Visão Geral & Métricas';
      case 'clients': return 'Painel & Ficha de Clientes';
      case 'stock': return 'Gestão de Estoque & Produtos';
      case 'sales': return 'Vendas & Registro de Gastos';
      case 'companies': return 'Gerenciador de Empresas';
      default: return 'Gerencie';
    }
  };

  return (
    <header style={{
      height: '68px',
      background: 'var(--bg-header)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      boxShadow: 'var(--shadow-xs)'
    }}>
      {/* Esquerda: Menu hambúrguer (mobile) + Título da tela */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          className="btn btn-secondary btn-icon"
          style={{ display: 'none' }}
          id="mobile-menu-btn"
          onClick={() => setMobileOpen(prev => !prev)}
        >
          <Menu size={18} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            {getPageTitle()}
          </h2>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {currentCompany?.logo ? (
              <img 
                src={currentCompany.logo} 
                alt="" 
                style={{ width: '16px', height: '16px', borderRadius: '4px', objectFit: 'contain' }}
              />
            ) : (
              <Building2 size={13} color="var(--primary)" />
            )}
            <span>{currentCompany?.trade_name || currentCompany?.name || 'Minha Empresa'}</span>
          </div>
        </div>
      </div>

      {/* Direita: Perfil do Usuário & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Status Conectado Supabase */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          background: isSupabaseConnected ? 'var(--success-light)' : 'var(--bg-subtle)',
          border: `1px solid ${isSupabaseConnected ? 'var(--success-border)' : 'var(--border-subtle)'}`,
          fontSize: '0.74rem',
          fontWeight: 600,
          color: isSupabaseConnected ? 'var(--success-text)' : 'var(--text-muted)'
        }}>
          <div style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: isSupabaseConnected ? 'var(--success)' : '#94a3b8'
          }} />
          <span>{isSupabaseConnected ? 'Nuvem Conectada' : 'Modo Offline'}</span>
        </div>

        {/* Perfil & Logout */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          paddingLeft: '12px',
          borderLeft: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: isMasterAdmin 
              ? 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)' 
              : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.82rem',
            boxShadow: 'var(--shadow-xs)'
          }}>
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2 }}>
                {user?.name || 'Usuário'}
              </span>
              {isMasterAdmin && (
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: 'var(--primary-light)',
                  border: '1px solid var(--primary-border)',
                  color: 'var(--primary-text)',
                  fontSize: '0.66rem',
                  fontWeight: 700
                }}>
                  MASTER
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {user?.email || ''}
            </span>
          </div>

          <button
            onClick={logout}
            className="btn btn-secondary btn-icon"
            title="Sair do sistema"
            style={{ marginLeft: '6px' }}
          >
            <LogOut size={16} color="var(--text-muted)" />
          </button>
        </div>
      </div>
    </header>
  );
};
