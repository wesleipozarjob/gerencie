import React, { useState, useRef } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Upload, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Phone, 
  Mail, 
  FileText, 
  ShieldCheck, 
  AlertCircle,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../lib/imageUtils';

export const CompaniesPage = () => {
  const { 
    companies, 
    createCompany, 
    updateCompany, 
    deleteCompany, 
    fetchCompanies 
  } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    trade_name: '',
    document: '',
    phone: '',
    email: '',
    logo: ''
  });
  const [imageSizeInfo, setImageSizeInfo] = useState('');
  const fileInputRef = useRef(null);

  // Filtragem de empresas
  const filteredCompanies = companies.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.trade_name && c.trade_name.toLowerCase().includes(term)) ||
      (c.document && c.document.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term))
    );
  });

  const openNewCompanyModal = () => {
    setEditingCompany(null);
    setFormData({
      name: '',
      trade_name: '',
      document: '',
      phone: '',
      email: '',
      logo: ''
    });
    setImageSizeInfo('');
    setIsModalOpen(true);
  };

  const openEditModal = (comp) => {
    setEditingCompany(comp);
    setFormData({
      name: comp.name || '',
      trade_name: comp.trade_name || comp.name || '',
      document: comp.document || '',
      phone: comp.phone || '',
      email: comp.email || '',
      logo: comp.logo || ''
    });
    setImageSizeInfo(comp.logo ? 'Foto salva' : '');
    setIsModalOpen(true);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Comprime a imagem para WebP/JPEG mantendo proporção de max 300px
      const compressedDataUrl = await compressImage(file, { maxWidth: 300, maxHeight: 300, quality: 0.82 });
      if (compressedDataUrl) {
        setFormData(prev => ({ ...prev, logo: compressedDataUrl }));
        // Estima o tamanho em KB do binário
        const kbSize = Math.round((compressedDataUrl.length * 3) / 4 / 1024);
        setImageSizeInfo(`Otimizada: ~${kbSize} KB (WebP super leve)`);
      }
    } catch (err) {
      alert('Erro ao processar imagem: ' + err.message);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, logo: '' }));
    setImageSizeInfo('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Por favor, informe a Razão Social da empresa.');
      return;
    }

    setIsSaving(true);
    setFeedbackMsg(null);

    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, formData);
        setFeedbackMsg({ type: 'success', text: `Empresa "${formData.trade_name || formData.name}" atualizada com sucesso!` });
      } else {
        await createCompany(formData);
        setFeedbackMsg({ type: 'success', text: `Empresa "${formData.trade_name || formData.name}" cadastrada com sucesso!` });
      }
      setIsModalOpen(false);
      await fetchCompanies();
    } catch (err) {
      console.error(err);
      setFeedbackMsg({ type: 'danger', text: 'Erro ao salvar empresa: ' + (err.message || 'Tente novamente.') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (comp) => {
    const confirmDel = window.confirm(`Tem certeza que deseja excluir a empresa "${comp.trade_name || comp.name}"?`);
    if (!confirmDel) return;

    try {
      await deleteCompany(comp.id);
      setFeedbackMsg({ type: 'success', text: `Empresa "${comp.trade_name || comp.name}" excluída.` });
    } catch (err) {
      alert('Erro ao excluir: ' + (err.message || 'Falha ao remover empresa.'));
    }
  };

  return (
    <div className="page-content" style={{ animation: 'fadeIn 0.2s ease' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Empresas
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            {companies.length === 0
              ? 'Nenhuma empresa cadastrada ainda'
              : `${companies.length} ${companies.length === 1 ? 'empresa cadastrada' : 'empresas cadastradas'}`}
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={openNewCompanyModal}
          style={{ padding: '10px 18px', fontSize: '0.9rem', gap: '8px' }}
        >
          <Plus size={18} />
          Cadastrar Nova Empresa
        </button>
      </div>

      {/* Feedback Message */}
      {feedbackMsg && (
        <div style={{
          background: feedbackMsg.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)',
          border: `1px solid ${feedbackMsg.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`,
          color: feedbackMsg.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button 
            onClick={() => setFeedbackMsg(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por Razão Social, Nome Fantasia, CNPJ/CPF, Telefone ou E-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        {searchTerm && (
          <button 
            className="btn btn-secondary" 
            onClick={() => setSearchTerm('')}
            style={{ fontSize: '0.82rem' }}
          >
            Limpar
          </button>
        )}
      </div>

      {/* Company Cards Grid */}
      <div className="companies-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
        gap: '20px'
      }}>
        {filteredCompanies.map(comp => {
          return (
            <div 
              key={comp.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-xs)',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >

              {/* Informações Principais */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                  {/* Logo / Foto da Empresa */}
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '14px',
                    border: '1px solid var(--border-subtle)',
                    background: comp.logo ? '#ffffff' : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                    boxShadow: 'var(--shadow-xs)'
                  }}>
                    {comp.logo ? (
                      <img 
                        src={comp.logo} 
                        alt={comp.trade_name || comp.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <Building2 size={28} color="var(--primary)" />
                    )}
                  </div>

                  {/* Nomes */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={{ 
                      fontSize: '1.15rem', 
                      fontWeight: 700, 
                      margin: '0 0 3px 0', 
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {comp.trade_name || comp.name}
                    </h3>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {comp.name}
                    </div>
                  </div>
                </div>

                {/* Detalhes de Contato & Documento */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '14px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '18px',
                  fontSize: '0.84rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <FileText size={15} color="var(--text-muted)" />
                    <span style={{ fontWeight: 500 }}>CNPJ/CPF:</span>
                    <span style={{ fontFamily: 'monospace' }}>{comp.document || 'Não informado'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <Phone size={15} color="var(--text-muted)" />
                    <span style={{ fontWeight: 500 }}>Telefone:</span>
                    <span>{comp.phone || 'Não informado'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <Mail size={15} color="var(--text-muted)" />
                    <span style={{ fontWeight: 500 }}>E-mail:</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {comp.email || 'Não informado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '0.84rem' }}
                  onClick={() => openEditModal(comp)}
                >
                  <Edit3 size={15} /> Editar
                </button>

                <button
                  className="btn btn-danger btn-icon"
                  title="Excluir empresa"
                  onClick={() => handleDelete(comp)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredCompanies.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '48px 24px',
            background: 'var(--bg-surface)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-xl)'
          }}>
            <Building2 size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Nenhuma empresa encontrada
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              {searchTerm ? 'Tente buscar com outros termos.' : 'Cadastre sua primeira empresa para começar.'}
            </p>
            <button className="btn btn-primary" onClick={openNewCompanyModal}>
              <Plus size={16} /> Cadastrar Empresa
            </button>
          </div>
        )}
      </div>

      {/* Modal de Cadastro / Edição */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 100
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '540px',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Building2 size={20} color="var(--primary)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    {editingCompany ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}
                  </h2>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Dados da empresa e foto de identificação
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="btn btn-secondary btn-icon"
                style={{ border: 'none', background: 'transparent' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Campo Foto / Logotipo da Empresa */}
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Logotipo / Foto da Empresa (Opcional)</span>
                  {imageSizeInfo && (
                    <span style={{ fontSize: '0.74rem', color: 'var(--success-text)', fontWeight: 600 }}>
                      {imageSizeInfo}
                    </span>
                  )}
                </label>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px dashed var(--border-subtle)'
                }}>
                  {/* Preview da Imagem */}
                  <div style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '12px',
                    background: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    {formData.logo ? (
                      <img 
                        src={formData.logo} 
                        alt="Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <ImageIcon size={28} color="var(--text-muted)" />
                    )}
                  </div>

                  {/* Controles de Upload */}
                  <div style={{ flex: 1 }}>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                      id="company-logo-input"
                    />

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <label 
                        htmlFor="company-logo-input" 
                        className="btn btn-secondary"
                        style={{ fontSize: '0.82rem', padding: '6px 12px', cursor: 'pointer' }}
                      >
                        <Upload size={14} />
                        {formData.logo ? 'Trocar Imagem' : 'Selecionar Imagem'}
                      </label>

                      {formData.logo && (
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                          onClick={handleRemoveImage}
                        >
                          <Trash2 size={14} />
                          Remover
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Comprimida automaticamente para binário WebP (~15KB) no banco de dados.
                    </div>
                  </div>
                </div>
              </div>

              {/* Razão Social */}
              <div className="form-group">
                <label className="form-label">Razão Social *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Comercial de Alimentos Pozar Ltda"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              {/* Nome Fantasia */}
              <div className="form-group">
                <label className="form-label">Nome Fantasia (Como aparecerá no sistema)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Mercado & Distribuidora Pozar"
                  value={formData.trade_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, trade_name: e.target.value }))}
                />
              </div>

              {/* CNPJ / CPF e Telefone em 2 colunas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">CNPJ ou CPF</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="00.000.000/0001-00"
                    value={formData.document}
                    onChange={(e) => setFormData(prev => ({ ...prev, document: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              {/* E-mail de Login do Cliente / Empresa */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>E-mail de Login da Empresa</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--primary)', fontWeight: 600 }}>Acesso do Sistema</span>
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="ex: cliente@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  🔑 O usuário que fizer login com este e-mail acessará exclusivamente o estoque, clientes e vendas desta empresa.
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '12px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                  style={{ minWidth: '130px' }}
                >
                  {isSaving ? 'Gravando...' : (editingCompany ? 'Salvar Alterações' : 'Cadastrar Empresa')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
