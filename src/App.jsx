import React, { useState } from 'react';
import { LogOut, Building2 } from 'lucide-react';
import logo from './assets/gerencie-logo.png';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { ClientsPage } from './pages/ClientsPage';
import { StockPage } from './pages/StockPage';
import { SalesPage } from './pages/SalesPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { NewSaleModal } from './components/NewSaleModal';

function MasterLayout() {
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      <header className="master-layout-header">
        <img src={logo} alt="Gerencie Sistemas" className="master-layout-logo" />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="master-layout-email" style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{user?.email}</span>
          <button onClick={logout} className="btn btn-secondary btn-icon" title="Sair">
            <LogOut size={16} color="var(--text-muted)" />
          </button>
        </div>
      </header>

      <main className="master-layout-main">
        <CompaniesPage />
      </main>

      <DevFooter />
    </div>
  );
}

function DevFooter() {
  return (
    <footer style={{
      padding: '18px 32px',
      borderTop: '1px solid var(--border-subtle)',
      textAlign: 'center',
      fontSize: '0.8rem',
      color: 'var(--text-muted)'
    }}>
      Desenvolvido por <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Weslei Pozar</strong>
    </footer>
  );
}

function NoCompanyScreen() {
  const { user, logout, reloadSession } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    await reloadSession();
    setChecking(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(ellipse at 50% 15%, #eff6ff 0%, #f8fafc 60%, #e2e8f0 100%)'
    }}>
      <div className="no-company-card" style={{
        width: '100%',
        maxWidth: '480px',
        background: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '36px',
        textAlign: 'center',
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.1)'
      }}>
        <img src={logo} alt="Gerencie Sistemas" style={{ maxWidth: '210px', width: '100%', height: 'auto', display: 'block', margin: '0 auto 20px' }} />
        
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--warning-light)',
          border: '1px solid var(--warning-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <Building2 size={26} color="var(--warning-text)" />
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
          Aguardando Vinculação de Empresa
        </h2>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
          Olá, <strong>{user?.email}</strong>! Seu login foi autenticado com sucesso, mas este e-mail ainda não está associado a nenhuma empresa no sistema.
        </p>

        <div style={{
          padding: '12px 16px',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          💡 <strong>O que fazer:</strong> Solicite ao administrador <strong>Weslei Pozar</strong> que cadastre a sua empresa no Gerenciador de Empresas informando o e-mail <code>{user?.email}</code>.
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            className="btn btn-primary"
            onClick={handleRefresh}
            disabled={checking}
            style={{ fontSize: '0.88rem', padding: '10px 18px' }}
          >
            {checking ? 'Verificando...' : 'Verificar Novamente'}
          </button>
          <button 
            className="btn btn-secondary"
            onClick={logout}
            style={{ fontSize: '0.88rem', padding: '10px 18px' }}
          >
            Sair
          </button>
        </div>
      </div>

      <footer style={{ marginTop: '24px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Desenvolvido por <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Weslei Pozar</strong>
      </footer>
    </div>
  );
}

function MainApp() {
  const { user, currentCompany, isMasterAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Estados dos modais globais
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [selectedClientForModal, setSelectedClientForModal] = useState(null);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main)',
        color: 'var(--text-muted)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(37, 99, 235, 0.15)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div>Conectando ao sistema...</div>
        </div>
      </div>
    );
  }

  // Se não estiver logado, exibe tela de login direta
  if (!user) {
    return <LoginPage />;
  }

  // Login master (weslei.pozar@hotmail.com): apenas o gerenciador de empresas
  if (isMasterAdmin) {
    return <MasterLayout />;
  }

  // Se o usuário comum não tem empresa associada
  if (!currentCompany) {
    return <NoCompanyScreen />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Lateral */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewSale={() => {
          setSelectedClientForModal(null);
          setIsSaleModalOpen(true);
        }}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Conteúdo Principal */}
      <div className="main-content">
        <Navbar
          activeTab={activeTab}
          setMobileOpen={setMobileOpen}
        />

        <main className="page-container">
          {activeTab === 'dashboard' && (
            <Dashboard
              setActiveTab={setActiveTab}
              onOpenNewSale={() => {
                setSelectedClientForModal(null);
                setIsSaleModalOpen(true);
              }}
              onOpenNewClient={() => setActiveTab('clients')}
              onOpenNewProduct={() => setActiveTab('stock')}
              onViewClient={(client) => {
                setSelectedClientForModal(client);
                setActiveTab('clients');
              }}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsPage
              selectedClientForModal={selectedClientForModal}
              onCloseModal={() => setSelectedClientForModal(null)}
              onOpenNewSaleWithClient={(client) => {
                setSelectedClientForModal(client);
                setIsSaleModalOpen(true);
              }}
            />
          )}

          {activeTab === 'stock' && (
            <StockPage />
          )}

          {activeTab === 'sales' && (
            <SalesPage
              onOpenNewSale={() => {
                setSelectedClientForModal(null);
                setIsSaleModalOpen(true);
              }}
            />
          )}
        </main>

        <DevFooter />
      </div>

      {/* Modal Global: Lançar Venda */}
      <NewSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => {
          setIsSaleModalOpen(false);
          setSelectedClientForModal(null);
        }}
        initialCustomer={selectedClientForModal}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </AuthProvider>
  );
}
