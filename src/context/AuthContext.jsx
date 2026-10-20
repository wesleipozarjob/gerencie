import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabaseClient, getSupabaseConfig } from '../lib/supabase';
import { toDbLogo, fromDbLogo } from '../lib/imageUtils';

// Converte a logo BYTEA (hex) vinda do banco para Data URL exibível
const normalizeCompany = (c) => (c ? { ...c, logo: fromDbLogo(c.logo) } : c);

const isMissingLogoColumn = (error) =>
  Boolean(error?.message && error.message.includes('logo') &&
    (error.message.includes('does not exist') || error.message.includes('schema cache')));

export const MASTER_ADMIN_EMAIL = 'weslei.pozar@hotmail.com';

export const isMasterEmail = (email) => {
  return Boolean(email && email.trim().toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase());
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Inicialização automática
  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    setLoading(true);
    const { isConfigured } = getSupabaseConfig();
    const supabase = getSupabaseClient();

    if (isConfigured && supabase) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!error && session?.user) {
          const authUser = session.user;
          const company = isMasterEmail(authUser.email) ? null : await fetchOrAssociateCompany(supabase, authUser);

          const loggedUser = {
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
            isSupabaseUser: true
          };

          setUser(loggedUser);
          setCurrentCompany(company);
          setIsSupabaseConnected(true);

          // Carrega lista de todas as empresas
          await fetchCompanies(supabase);

          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Erro ao restaurar sessão Supabase:', err);
      }
    }

    // Com Supabase configurado, só vale sessão real do Supabase (impede forjar login via localStorage)
    if (isConfigured) {
      localStorage.removeItem('gerencie_local_user');
      setLoading(false);
      return;
    }

    // Carregar sessão local apenas se não houver Supabase configurado
    const savedLocalUser = localStorage.getItem('gerencie_local_user');
    const savedCompany = localStorage.getItem('gerencie_current_company');
    const savedCompanies = localStorage.getItem('gerencie_all_companies');

    if (savedLocalUser) {
      setUser(JSON.parse(savedLocalUser));
    }
    if (savedCompany) {
      setCurrentCompany(JSON.parse(savedCompany));
    }
    if (savedCompanies) {
      setCompanies(JSON.parse(savedCompanies));
    }

    setLoading(false);
  };

  // Carrega todas as empresas do Supabase ou Local
  const fetchCompanies = async (clientOverride = null) => {
    const supabase = clientOverride || getSupabaseClient();
    const { isConfigured } = getSupabaseConfig();

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data) {
          const list = data.map(normalizeCompany);
          setCompanies(list);
          localStorage.setItem('gerencie_all_companies', JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.error('Erro ao listar empresas do Supabase:', err);
      }
    }

    const saved = localStorage.getItem('gerencie_all_companies');
    if (saved) {
      const parsed = JSON.parse(saved);
      setCompanies(parsed);
      return parsed;
    }
    return [];
  };

  // Localiza ou associa a empresa correta no Supabase pelo e-mail do usuário
  const fetchOrAssociateCompany = async (supabase, authUser) => {
    try {
      if (!authUser?.email) return null;
      const userEmail = authUser.email.trim().toLowerCase();

      // 1. Prioridade: busca se há uma empresa cadastrada com o e-mail deste usuário
      const { data: companiesByEmail, error: emailErr } = await supabase
        .from('companies')
        .select('*')
        .ilike('email', userEmail)
        .limit(1);

      if (!emailErr && companiesByEmail && companiesByEmail.length > 0) {
        const matchingCompany = normalizeCompany(companiesByEmail[0]);

        // Vincula / corrige o perfil com a empresa certa
        await supabase.from('profiles').upsert({
          id: authUser.id,
          email: authUser.email,
          company_id: matchingCompany.id,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
          role: 'admin'
        });

        localStorage.setItem('gerencie_current_company', JSON.stringify(matchingCompany));
        return matchingCompany;
      }

      // 2. Se não achou empresa com o e-mail direto, verifica se o perfil já foi associado manualmente
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, company:companies(*)')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profile?.company) {
        // Se a empresa vinculada no profile tiver outro email diferente do usuário e houver mais empresas,
        // só aceita se for uma associação válida
        const comp = normalizeCompany(profile.company);
        localStorage.setItem('gerencie_current_company', JSON.stringify(comp));
        return comp;
      }

      // 3. Se não houver empresa vinculada, NUNCA vincula a empresa de outro cliente por engano!
      localStorage.removeItem('gerencie_current_company');
      return null;
    } catch (err) {
      console.error('Erro ao buscar/associar empresa no Supabase:', err);
      return null;
    }
  };

  // Login direto (E-mail e Senha criados no Supabase)
  const login = async (email, password) => {
    const supabase = getSupabaseClient();
    const { isConfigured } = getSupabaseConfig();

    if (!isConfigured || !supabase) {
      // Fallback local se não tiver chave configurada
      const localUser = {
        id: 'usr-local',
        email: email || 'admin@gerencie.com',
        name: email ? email.split('@')[0].toUpperCase() : 'Gestor',
        isSupabaseUser: false
      };
      const fallbackCompany = {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Minha Empresa',
        trade_name: 'Minha Empresa'
      };
      localStorage.setItem('gerencie_local_user', JSON.stringify(localUser));
      localStorage.setItem('gerencie_current_company', JSON.stringify(fallbackCompany));
      setUser(localUser);
      setCurrentCompany(fallbackCompany);
      await fetchCompanies();
      return { success: true, localMode: true };
    }

    // Autenticação Real no Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });

    if (error) {
      throw error;
    }

    const authUser = data.user;
    const company = isMasterEmail(authUser.email) ? null : await fetchOrAssociateCompany(supabase, authUser);

    const loggedUser = {
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
      isSupabaseUser: true
    };

    setUser(loggedUser);
    setCurrentCompany(company);
    setIsSupabaseConnected(true);

    // Carregar todas as empresas disponíveis
    await fetchCompanies(supabase);

    return { success: true, company, user: loggedUser };
  };

  // Trocar empresa ativa (para alternar visão no sistema)
  const switchCompany = (company) => {
    if (!company) return;
    setCurrentCompany(company);
    localStorage.setItem('gerencie_current_company', JSON.stringify(company));
  };

  // Atualizar dados da empresa atual (ex: troca de logo ou nome)
  const updateCurrentCompany = (updatedCompany) => {
    setCurrentCompany(updatedCompany);
    localStorage.setItem('gerencie_current_company', JSON.stringify(updatedCompany));
    setCompanies(prev => prev.map(c => c.id === updatedCompany.id ? updatedCompany : c));
  };

  // Cadastrar nova empresa (com foto/logo em base64 binário)
  const createCompany = async (companyData) => {
    const supabase = getSupabaseClient();
    const { isConfigured } = getSupabaseConfig();

    const newCompanyPayload = {
      name: companyData.name,
      trade_name: companyData.trade_name || companyData.name,
      document: companyData.document || null,
      phone: companyData.phone || null,
      email: companyData.email || null,
      logo: toDbLogo(companyData.logo)
    };

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('companies')
          .insert([newCompanyPayload])
          .select()
          .single();

        if (error) {
          // Coluna 'logo' ainda não criada no Supabase: salva sem a foto
          if (isMissingLogoColumn(error)) {
            const { logo, ...payloadWithoutLogo } = newCompanyPayload;
            const retryRes = await supabase.from('companies').insert([payloadWithoutLogo]).select().single();
            if (retryRes.error) throw retryRes.error;
            const created = normalizeCompany(retryRes.data);
            setCompanies(prev => [created, ...prev]);
            return created;
          }
          throw error;
        }

        const created = normalizeCompany(data);
        if (newCompanyPayload.email) {
          try {
            await supabase.from('profiles').update({ company_id: created.id }).ilike('email', newCompanyPayload.email.trim());
          } catch (pErr) {
            console.warn('Aviso ao sincronizar perfil do e-mail:', pErr);
          }
        }
        setCompanies(prev => [created, ...prev]);
        return created;
      } catch (err) {
        console.error('Erro ao criar empresa no Supabase:', err);
        throw err;
      }
    }

    // Modo local offline
    const localCreated = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `comp-${Date.now()}`,
      ...newCompanyPayload,
      logo: companyData.logo || null,
      created_at: new Date().toISOString()
    };
    const updatedList = [localCreated, ...companies];
    setCompanies(updatedList);
    localStorage.setItem('gerencie_all_companies', JSON.stringify(updatedList));
    return localCreated;
  };

  // Editar empresa existente
  const updateCompany = async (companyId, companyData) => {
    const supabase = getSupabaseClient();
    const { isConfigured } = getSupabaseConfig();

    const updatePayload = {
      name: companyData.name,
      trade_name: companyData.trade_name || companyData.name,
      document: companyData.document || null,
      phone: companyData.phone || null,
      email: companyData.email || null,
      logo: toDbLogo(companyData.logo),
      updated_at: new Date().toISOString()
    };

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('companies')
          .update(updatePayload)
          .eq('id', companyId)
          .select()
          .single();

        let saved = data;
        if (error) {
          if (isMissingLogoColumn(error)) {
            const { logo, ...payloadWithoutLogo } = updatePayload;
            const retryRes = await supabase.from('companies').update(payloadWithoutLogo).eq('id', companyId).select().single();
            if (retryRes.error) throw retryRes.error;
            saved = retryRes.data;
          } else {
            throw error;
          }
        }

        const updated = normalizeCompany(saved);
        if (updatePayload.email) {
          try {
            await supabase.from('profiles').update({ company_id: companyId }).ilike('email', updatePayload.email.trim());
          } catch (pErr) {
            console.warn('Aviso ao sincronizar perfil do e-mail:', pErr);
          }
        }
        if (currentCompany?.id === companyId) {
          updateCurrentCompany(updated);
        } else {
          setCompanies(prev => prev.map(c => c.id === companyId ? updated : c));
        }
        return updated;
      } catch (err) {
        console.error('Erro ao atualizar empresa no Supabase:', err);
        throw err;
      }
    }

    // Modo local offline
    const existing = companies.find(c => c.id === companyId) || {};
    const updated = { ...existing, ...updatePayload, logo: companyData.logo || null, id: companyId };
    const updatedList = companies.map(c => c.id === companyId ? updated : c);
    setCompanies(updatedList);
    localStorage.setItem('gerencie_all_companies', JSON.stringify(updatedList));

    if (currentCompany?.id === companyId) {
      updateCurrentCompany(updated);
    }
    return updated;
  };

  // Excluir empresa
  const deleteCompany = async (companyId) => {
    const supabase = getSupabaseClient();
    const { isConfigured } = getSupabaseConfig();

    if (isConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('companies')
          .delete()
          .eq('id', companyId);

        if (error) throw error;
      } catch (err) {
        console.error('Erro ao excluir empresa no Supabase:', err);
        throw err;
      }
    }

    const updatedList = companies.filter(c => c.id !== companyId);
    setCompanies(updatedList);
    localStorage.setItem('gerencie_all_companies', JSON.stringify(updatedList));

    // Se excluiu a empresa atual, seleciona a primeira restante
    if (currentCompany?.id === companyId) {
      if (updatedList.length > 0) {
        switchCompany(updatedList[0]);
      } else {
        setCurrentCompany(null);
      }
    }
    return true;
  };

  // Logout
  const logout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error(err);
      }
    }
    localStorage.removeItem('gerencie_local_user');
    localStorage.removeItem('gerencie_current_company');
    setUser(null);
    setCurrentCompany(null);
    setIsSupabaseConnected(false);
  };

  const isMasterAdmin = Boolean(user?.email && isMasterEmail(user.email));

  return (
    <AuthContext.Provider
      value={{
        user,
        currentCompany,
        setCurrentCompany,
        companies,
        isMasterAdmin,
        loading,
        isSupabaseConnected,
        login,
        logout,
        switchCompany,
        createCompany,
        updateCompany,
        deleteCompany,
        fetchCompanies,
        updateCurrentCompany,
        reloadSession: initAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
