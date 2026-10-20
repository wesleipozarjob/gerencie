import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/gerencie-logo.png';

export const LoginPage = () => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      console.error(err);
      if (err.message?.includes('Invalid login credentials')) {
        setErrorMsg('E-mail ou senha incorretos. Verifique os dados cadastrados no Supabase.');
      } else {
        setErrorMsg('Falha ao autenticar: ' + (err.message || 'Erro inesperado'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      background: 'radial-gradient(ellipse at 50% 15%, #eff6ff 0%, #f8fafc 60%, #e2e8f0 100%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '36px',
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.1)'
      }}>
        {/* Header com Logo */}
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <h1 style={{ margin: '0 0 10px 0' }}>
            <img src={logo} alt="Gerencie Sistemas" style={{ width: '230px', height: 'auto', display: 'block', margin: '0 auto' }} />
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
            Acesse o sistema da sua empresa
          </p>
        </div>

        {errorMsg && (
          <div style={{
            background: 'var(--danger-light)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            fontSize: '0.85rem',
            color: 'var(--danger-text)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulário de Acesso Direto */}
        <form onSubmit={handleLogin}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label">E-mail de Acesso</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-control"
                placeholder="seu-email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Senha */}
          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem', marginTop: '10px' }}
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar no Sistema'}
            <ArrowRight size={17} />
          </button>
        </form>
      </div>

      <footer style={{ marginTop: '24px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Desenvolvido por <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Weslei Pozar</strong>
      </footer>
    </div>
  );
};
