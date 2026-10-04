-- =========================================================
-- PLANERSEMAN - GESTÃO DE ATIVIDADES, PRAZOS E MANUTENÇÃO
-- SCHEMA POSTGRESQL PARA SUPABASE
-- =========================================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE RESPONSÁVEIS / EQUIPE
CREATE TABLE IF NOT EXISTS assignees (
    id TEXT PRIMARY KEY DEFAULT ('ass-' || substr(md5(random()::text), 1, 10)),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    sector TEXT NOT NULL,
    phone TEXT NOT NULL, -- Ex: 5527999887766
    email TEXT,
    active BOOLEAN DEFAULT TRUE,
    avatar_color TEXT DEFAULT 'bg-blue-600',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE PROJETOS
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY DEFAULT ('proj-' || substr(md5(random()::text), 1, 10)),
    name TEXT NOT NULL,
    description TEXT,
    manager_id TEXT REFERENCES assignees(id) ON DELETE SET NULL,
    manager_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('planejamento', 'em_andamento', 'pausado', 'concluido', 'cancelado')),
    priority TEXT NOT NULL CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE ATIVIDADES
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY DEFAULT ('task-' || substr(md5(random()::text), 1, 10)),
    title TEXT NOT NULL,
    description TEXT,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    project_name TEXT,
    assignee_id TEXT NOT NULL REFERENCES assignees(id) ON DELETE RESTRICT,
    assignee_name TEXT,
    assignee_phone TEXT,
    sector TEXT NOT NULL,
    equipment TEXT NOT NULL,
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
    status TEXT NOT NULL CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'pausada')),
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    impediment TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 4. TABELA DE HISTÓRICO DE AUDITORIA DE ATIVIDADES
CREATE TABLE IF NOT EXISTS task_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    changed_by TEXT NOT NULL,
    field TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ÍNDICES DE ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- 6. HABILITAÇÃO DE ROW LEVEL SECURITY (RLS)
ALTER TABLE assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso livre para leitura e gravação (ajustar conforme regras da Fibrasa)
CREATE POLICY "Acesso total assignees" ON assignees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total task_history" ON task_history FOR ALL USING (true) WITH CHECK (true);

-- Permissões de acesso para a API pública (anon) e autenticada do Supabase
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;


-- 7. SEED INICIAL DE DADOS
INSERT INTO assignees (id, name, role, sector, phone, email, active, avatar_color)
VALUES 
('ass-1', 'Gustavo Mendes', 'Mecânico Líder', 'Manutenção Mecânica', '5527998123456', 'gustavo.mendes@fibrasa.com.br', true, 'bg-blue-600'),
('ass-2', 'Carlos Eduardo', 'Eletricista Industrial', 'Manutenção Elétrica', '5527997654321', 'carlos.eduardo@fibrasa.com.br', true, 'bg-emerald-600'),
('ass-3', 'Frank Silva', 'Coordenador de Manutenção', 'Coordenação de Manutenção', '5527999112233', 'frank.silva@fibrasa.com.br', true, 'bg-indigo-600'),
('ass-4', 'Marcelo Peçanha', 'Técnico de Automação', 'Automação / Instrumentação', '5527998776655', 'marcelo.p@fibrasa.com.br', true, 'bg-amber-600'),
('ass-5', 'Rodrigo Alvarenga', 'Lubrificador Industrial', 'Manutenção Preventiva', '5527996332211', 'rodrigo.a@fibrasa.com.br', true, 'bg-purple-600')
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, name, description, manager_id, manager_name, start_date, due_date, status, priority)
VALUES
('proj-1', 'Recuperação do Chiller Sabroe', 'Reforma completa do sistema de refrigeração industrial, limpeza química dos trocadores e revisão do compressor parafuso.', 'ass-3', 'Frank Silva', '2026-09-01', '2026-09-22', 'em_andamento', 'critica'),
('proj-2', 'Revisão Preventiva Semestral - Extrusora 03', 'Inspeção de rosca e cilindro, alinhamento do redutor, calibração das zonas de aquecimento e troca do óleo lubrificante.', 'ass-1', 'Gustavo Mendes', '2026-09-10', '2026-09-25', 'em_andamento', 'alta'),
('proj-3', 'Adequação NR-12 Termoformadora Illig 02', 'Instalação de cortinas de luz, relés de segurança certificados, sensores de intertravamento de portas e laudo técnico de conformidade.', 'ass-2', 'Carlos Eduardo', '2026-09-15', '2026-10-30', 'planejamento', 'alta')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, title, description, project_id, project_name, assignee_id, assignee_name, assignee_phone, sector, equipment, start_date, due_date, priority, status, progress_percent, impediment, notes)
VALUES
('task-1', 'Realizar limpeza do trocador de calor de placas', 'Desmontagem dos cabeçotes, circulação de desincrustante ácido neutro e enxágue com água pressurizada.', 'proj-1', 'Recuperação do Chiller Sabroe', 'ass-1', 'Gustavo Mendes', '5527998123456', 'Utilidades', 'Chiller Sabroe 01', '2026-09-12', '2026-09-20', 'critica', 'em_andamento', 65, 'Aguardando liberação do equipamento pela produção', 'Circuito químico já preparado.'),
('task-2', 'Substituição do selo mecânico da bomba primária', 'Troca do selo mecânico com vazamento de glicol no mancal de acionamento.', 'proj-1', 'Recuperação do Chiller Sabroe', 'ass-1', 'Gustavo Mendes', '5527998123456', 'Utilidades', 'Bomba Primária Chiller', '2026-09-08', '2026-09-16', 'critica', 'em_andamento', 40, 'Aguardando chegada da gaxeta sobressalente do almoxarifado', 'Almoxarifado informou previsão para hoje.')
ON CONFLICT (id) DO NOTHING;
