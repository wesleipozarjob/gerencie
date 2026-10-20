import React, { useState } from 'react';
import { Database, Key, CheckCircle2, Copy, ExternalLink, X, Shield, RefreshCw } from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig, resetSupabaseClient } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const SupabaseConfigModal = ({ isOpen, onClose }) => {
  const { isSupabaseConnected, reloadSession } = useAuth();
  const { refreshData } = useData();

  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.supabaseUrl || 'https://kmobwowcxegheknlosgx.supabase.co');
  const [anonKey, setAnonKey] = useState(currentConfig.supabaseAnonKey || '');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage('');

    try {
      saveSupabaseConfig(url, anonKey);
      resetSupabaseClient();
      await reloadSession();
      await refreshData();
      setStatusMessage('Configurações salvas com sucesso!');
    } catch (err) {
      setStatusMessage('Erro ao atualizar configurações: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToLocal = async () => {
    if (window.confirm('Deseja desconectar o Supabase e voltar para o Modo Local?')) {
      clearSupabaseConfig();
      resetSupabaseClient();
      setAnonKey('');
      await reloadSession();
      await refreshData();
      setStatusMessage('Voltando ao modo local persistente.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <Database size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>Conexão com o Supabase</h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Projeto: Gerencie (ID: kmobwowcxegheknlosgx)
              </div>
            </div>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Status atual */}
            <div style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: isSupabaseConnected ? 'var(--success-light)' : 'var(--warning-light)',
              border: `1px solid ${isSupabaseConnected ? 'var(--success-border)' : 'var(--warning-border)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontWeight: 700, color: isSupabaseConnected ? 'var(--success-text)' : 'var(--warning-text)', fontSize: '0.9rem' }}>
                  {isSupabaseConnected ? '✅ Supabase Conectado & Ativo' : 'ℹ️ Operando em Modo Local / Demonstração'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {isSupabaseConnected 
                    ? 'Todas as alterações são sincronizadas diretamente com o banco de dados Supabase na nuvem.'
                    : 'Os dados estão salvos e funcionando com segurança no seu navegador. Insira a Anon Key abaixo para conectar ao Supabase.'}
                </div>
              </div>
            </div>

            {statusMessage && (
              <div style={{ fontSize: '0.82rem', color: 'var(--success-text)', background: 'var(--success-light)', border: '1px solid var(--success-border)', padding: '8px 12px', borderRadius: '6px' }}>
                {statusMessage}
              </div>
            )}

            {/* URL do Supabase */}
            <div className="form-group">
              <label className="form-label">Supabase URL (Projeto Gerencie)</label>
              <input
                type="text"
                className="form-control"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>

            {/* Anon Key */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Anon Key (Public API Key)</span>
                <a 
                  href="https://supabase.com/dashboard/project/kmobwowcxegheknlosgx/settings/api" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ color: 'var(--primary)', fontSize: '0.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                >
                  Obter no Painel Supabase <ExternalLink size={12} />
                </a>
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
              />
            </div>

            {/* Instrução do Script SQL */}
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  📜 Script SQL do Banco de Dados
                </span>
                <a
                  href="https://supabase.com/dashboard/project/kmobwowcxegheknlosgx/sql"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  Abrir SQL Editor <ExternalLink size={12} />
                </a>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                O arquivo <code>supabase-schema.sql</code> foi criado na raiz do seu projeto com todas as tabelas (empresas, perfis, clientes, estoque e vendas com débito). Basta rodá-lo no SQL Editor do Supabase para criar a estrutura completa.
              </p>
            </div>
          </div>

          <div className="modal-footer">
            {currentConfig.isConfigured && (
              <button 
                type="button" 
                className="btn btn-danger btn-sm"
                onClick={handleResetToLocal}
                style={{ marginRight: 'auto' }}
              >
                Desconectar Supabase
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Fechar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              <RefreshCw size={14} className={isSaving ? 'spin' : ''} />
              {isSaving ? 'Salvando...' : 'Salvar & Conectar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
