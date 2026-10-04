# PlanerSeman — Gestão de Prazos e Atividades (Fibrasa S.A.)

Sistema executivo de gestão de atividades, responsabilidades e cobrança de prazos, projetado com foco na **Coordenação de Manutenção Industrial da Fibrasa** e expansível para outros projetos e áreas corporativas.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 19)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS com paleta e identidade visual oficial da **Fibrasa S.A.**
- **Banco de Dados**: [Supabase](https://supabase.com/) (PostgreSQL Cloud com Row Level Security)
- **Visualização de Dados**: [Recharts](https://recharts.org/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Comunicação**: Módulo integrado para cobrança e acompanhamento de prazos via WhatsApp com 1 clique

---

## 🚀 Funcionalidades

- **Dashboard Executivo**:
  - Total de atividades, Concluídas, Em andamento, Atrasadas, Impedidas e Vencendo hoje.
  - Gráficos de distribuição por status, carga de trabalho por responsável e evolução temporal.
  - Tabela com atividades críticas e cálculo automático de dias de atraso.
- **Gestão de Projetos**:
  - CRUD completo com cálculo de progresso percentual (%) e resumo de status.
  - Página individual de cada projeto com listagem de suas atividades vinculadas.
- **Gestão de Atividades**:
  - Cadastro detalhado com título, escopo, setor, equipamento, responsável, datas de início e término, prioridade, status, % de conclusão e registro de impedimentos.
  - Filtros rápidos por texto, status, responsável, prioridade, setor e atrasos.
- **Equipe & Responsáveis**:
  - Gestão de técnicos, mecânicos, eletricistas e supervisores.
  - Monitoramento de sobrecarga e canal de contato direto com WhatsApp.
- **Calendário de Prazos**:
  - Visão mensal com deadlines destacados e painel de atividades do dia selecionado.
- **Relatórios Executivos**:
  - Filtros avançados por período, taxa de aderência aos prazos, exportação para planilha **CSV/Excel** e layout otimizado para **Impressão/PDF**.
- **Cobrança WhatsApp Integrada**:
  - Disparo de lembretes, cobranças de prazos expirados ou alinhamento de impedimentos com mensagem pré-formatada no WhatsApp.

---

## ⚙️ Configuração do Ambiente

1. Clone o repositório:
   ```bash
   git clone https://github.com/manutencaofibrasa/planer-fibrasa.git
   cd planer-fibrasa
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie o arquivo `.env.local` na raiz:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```

4. No Supabase, execute o script SQL localizado em `supabase/schema.sql`.

5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

6. Acesse no navegador:
   `http://localhost:3000`
