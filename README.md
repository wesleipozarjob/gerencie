# 🚀 Gerencie - Sistema de Gestão Empresarial, Clientes e Estoque

Sistema completo, moderno e responsivo desenvolvido com **React + Vite**, integrado ao **Supabase** e pronto para deploy na **Vercel**.

---

## 🌟 Funcionalidades Principais

### 1. 🏢 Multi-Empresa (Multi-Tenant)
- Suporte a múltiplas empresas no mesmo portal.
- Alternância rápida de empresa ativa no menu lateral.
- Isolamento total dos dados de cada empresa (clientes, vendas, movimentações e estoque).
- Cadastro de nova empresa e usuários no login.

### 2. 👥 Painel & Ficha de Clientes
- **Cadastro Completo**: Nome, Telefone / WhatsApp, CPF/CNPJ, E-mail, Endereço, Limite de Crédito e Observações.
- **Métricas Individuais por Cliente**:
  - Gasto total realizado no mês atual.
  - Gasto histórico acumulado.
  - Total que o cliente está **devendo** (em aberto / fiado).
  - Data da última compra.
- **Ficha Financeira do Cliente (Extrato Completo)**:
  - Histórico detalhado de todas as compras realizadas pelo cliente com itens e quantidades.
  - Baixa de pagamento rápida (receber valor parcial ou quitar toda a dívida com 1 clique e efeito visual de confetes).
  - Lançamento de nova compra direto na ficha do cliente.

### 3. 📦 Gestão de Estoque & Produtos
- **Cadastro de Produtos**: Nome, Código/SKU, Categoria, Preço de Custo, Preço de Venda, Quantidade Atual, Quantidade Mínima para Alerta e Unidade de Medida (`un`, `kg`, `cx`, etc.).
- **Controle de Níveis**:
  - Alerta visual em amarelo quando o estoque atinge o limite mínimo.
  - Alerta em vermelho quando o produto está esgotado.
- **Ações Rápidas em Linha**:
  - `+ Entrada`: Adição rápida de unidades ao estoque com registro de motivo/NF.
  - `- Saída`: Baixa manual de unidades por perda, avaria ou consumo interno.
- **Histórico de Movimentações**: Registro auditável de entradas, saídas, ajustes e vendas.

### 4. 🛒 Vendas & Registro de Gastos
- Lançamento rápido de pedidos selecionando o cliente e produtos do estoque.
- Cálculo automático de subtotais e totais.
- **Condições de Pagamento Flexíveis**:
  - Totalmente Pago (à vista no PIX, Dinheiro, Cartão).
  - A Prazo / Fiado (Totalmente Devendo).
  - Entrada Parcial (valor de entrada com cálculo automático do restante a receber).
- Baixa automática da quantidade dos itens no estoque no momento da venda.

### 5. 📊 Dashboard Geral
- Faturamento do mês em tempo real.
- Total a receber de clientes em débito.
- Patrimônio total avaliado em estoque.
- Lista rápida dos clientes com maiores débitos pendentes e alertas de estoque crítico.

---

## 🗄️ Integração com Supabase

- **Project ID**: `kmobwowcxegheknlosgx`
- **URL Base**: `https://kmobwowcxegheknlosgx.supabase.co`

### Passo a Passo para Ativar o Banco Supabase:
1. Acesse o **SQL Editor** do seu projeto no Supabase: [Abrir SQL Editor](https://supabase.com/dashboard/project/kmobwowcxegheknlosgx/sql).
2. Abra o arquivo `supabase-schema.sql` gerado na raiz deste projeto, copie o conteúdo e clique em **RUN**.
3. Acesse **Project Settings > API** e copie sua **anon public key**.
4. No sistema Gerencie, clique no botão **"Banco Supabase"** no canto inferior esquerdo ou superior e cole sua chave.
5. Pronto! O sistema passará a salvar e ler tudo diretamente no seu PostgreSQL Supabase na nuvem.

> 💡 *Nota:* Enquanto a chave não for configurada, o sistema funciona perfeitamente em modo Local / Demonstração com persistência no navegador, garantindo que você possa testar e demonstrar todas as funcionalidades imediatamente.

---

## 💻 Como Rodar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev
```

Abra no navegador em `http://localhost:5173`.

---

## 🚀 Deploy na Vercel

O projeto já inclui o arquivo `vercel.json` configurado para roteamento SPA sem erros de 404.

1. Suba o código para o seu GitHub/GitLab.
2. Na Vercel, clique em **Add New Project** e selecione o repositório `Gerencie`.
3. Em **Environment Variables**, adicione (opcionalmente):
   - `VITE_SUPABASE_URL`: `https://kmobwowcxegheknlosgx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: Sua chave anon pública do Supabase.
4. Clique em **Deploy**!
