-- ============================================================================
-- SAUDESTUDY - SUPABASE SQL COMPLETO
-- Plataforma de Estudos com IA para Concursos na Área da Saúde
-- Autor: Robson Cordeiro dos Santos
-- ============================================================================
-- Como usar:
-- 1. Acesse o SQL Editor do seu projeto Supabase
-- 2. Clique em "New Query"
-- 3. Cole TODO este conteúdo
-- 4. Clique em "Run"
-- ============================================================================

-- ============================================================================
-- 0. LIMPEZA (RECOMENDADO: Descomente para resetar e evitar erros de coluna)
-- ============================================================================
DROP TABLE IF EXISTS public.credit_transactions CASCADE;
DROP TABLE IF EXISTS public.attempts CASCADE;
DROP TABLE IF EXISTS public.simulations CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.api_keys CASCADE;
DROP TABLE IF EXISTS public.admin_contents CASCADE;

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABELAS
-- ============================================================================

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS public.users (
  id              SERIAL PRIMARY KEY,
  union_id        VARCHAR(255) UNIQUE,
  email           VARCHAR(320) UNIQUE,
  password        VARCHAR(255),
  name            VARCHAR(255),
  avatar          TEXT,
  role            VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  credits         INTEGER NOT NULL DEFAULT 5,
  plan            VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'monthly', 'semester', 'annual')),
  plan_expires_at TIMESTAMPTZ,
  blocked         BOOLEAN NOT NULL DEFAULT FALSE,
  block_reason    VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sign_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GARANTIR QUE AS COLUNAS EXISTEM (Caso a tabela já tenha sido criada sem elas)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='credits') THEN
        ALTER TABLE public.users ADD COLUMN credits INTEGER NOT NULL DEFAULT 5;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='plan') THEN
        ALTER TABLE public.users ADD COLUMN plan VARCHAR(20) NOT NULL DEFAULT 'free';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='blocked') THEN
        ALTER TABLE public.users ADD COLUMN blocked BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='union_id') THEN
        ALTER TABLE public.users ADD COLUMN union_id VARCHAR(255) UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar') THEN
        ALTER TABLE public.users ADD COLUMN avatar TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='plan_expires_at') THEN
        ALTER TABLE public.users ADD COLUMN plan_expires_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='block_reason') THEN
        ALTER TABLE public.users ADD COLUMN block_reason VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updated_at') THEN
        ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_sign_in_at') THEN
        ALTER TABLE public.users ADD COLUMN last_sign_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password') THEN
        ALTER TABLE public.users ADD COLUMN password VARCHAR(255);
    END IF;
END $$;

-- Comentários para documentação
COMMENT ON TABLE public.users IS 'Usuários da plataforma (alunos e administradores)';
COMMENT ON COLUMN public.users.role IS 'user = aluno, admin = administrador';
COMMENT ON COLUMN public.users.credits IS 'Créditos disponíveis. 1 credito = 50MB upload ou 1 geração de simulado';
COMMENT ON COLUMN public.users.plan IS 'free, monthly (R$49), semester (R$265), annual (R$497)';

-- Tabela de Matérias/Disciplinas
CREATE TABLE IF NOT EXISTS public.subjects (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon        VARCHAR(100),
  category    VARCHAR(100),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_by  INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Materiais de Estudo
CREATE TABLE IF NOT EXISTS public.materials (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  file_url    VARCHAR(500) NOT NULL,
  file_size   BIGINT NOT NULL,
  mime_type   VARCHAR(100),
  subject_id  INTEGER REFERENCES public.subjects(id) ON DELETE SET NULL,
  uploaded_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  is_public   BOOLEAN NOT NULL DEFAULT TRUE,
  is_official BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.materials.is_official IS 'TRUE = material enviado pelo admin, disponível sem custo';

-- Tabela de Simulados/Provas
CREATE TABLE IF NOT EXISTS public.simulations (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  type         VARCHAR(20) NOT NULL CHECK (type IN ('quiz', 'exam', 'questionnaire')),
  subject_id   INTEGER REFERENCES public.subjects(id) ON DELETE SET NULL,
  material_id  INTEGER REFERENCES public.materials(id) ON DELETE SET NULL,
  created_by   INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  questions    JSONB NOT NULL DEFAULT '[]'::jsonb,
  config       JSONB,
  is_public    BOOLEAN NOT NULL DEFAULT TRUE,
  credit_cost  INTEGER NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.simulations.questions IS 'Array de questões com: id, text, options, correctAnswer, explanation';
COMMENT ON COLUMN public.simulations.config IS '{"timeLimit": 60, "difficulty": "medium"}';

-- Tabela de Tentativas/Realizações de Simulados
CREATE TABLE IF NOT EXISTS public.attempts (
  id              SERIAL PRIMARY KEY,
  simulation_id   INTEGER REFERENCES public.simulations(id) ON DELETE CASCADE,
  user_id         INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
  answers         JSONB NOT NULL DEFAULT '[]'::jsonb,
  score           NUMERIC(5,2),
  correct_count   INTEGER,
  total_questions INTEGER,
  time_spent      INTEGER,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Transações de Créditos
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('initial', 'purchase', 'usage', 'bonus')),
  amount      INTEGER NOT NULL,
  description VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Chaves de API (LLMs)
CREATE TABLE IF NOT EXISTS public.api_keys (
  id         SERIAL PRIMARY KEY,
  provider   VARCHAR(100) NOT NULL,
  key_value  VARCHAR(500) NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Conteúdo Oficial do Admin por Matéria
CREATE TABLE IF NOT EXISTS public.admin_contents (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  content     TEXT NOT NULL,
  subject_id  INTEGER REFERENCES public.subjects(id) ON DELETE CASCADE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_by  INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. ÍNDICES (performance)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_blocked ON public.users(blocked);
CREATE INDEX IF NOT EXISTS idx_materials_subject ON public.materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_official ON public.materials(is_official);
CREATE INDEX IF NOT EXISTS idx_simulations_subject ON public.simulations(subject_id);
CREATE INDEX IF NOT EXISTS idx_simulations_type ON public.simulations(type);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON public.attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_simulation ON public.attempts(simulation_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON public.credit_transactions(user_id);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) - Ativar em todas as tabelas
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_contents ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para obter o ID local do usuário baseado no JWT do Supabase
-- Isso resolve o erro "cannot cast type uuid to integer"
CREATE OR REPLACE FUNCTION public.get_my_id()
RETURNS INTEGER AS $$
DECLARE
  v_id INTEGER;
BEGIN
  -- Tenta encontrar pelo email do JWT do Supabase ou pelo union_id
  SELECT id INTO v_id FROM public.users 
  WHERE email = auth.jwt()->>'email' 
     OR union_id = auth.uid()::TEXT 
  LIMIT 1;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Política helper: verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = public.get_my_id()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 4. POLICIES (RLS)
-- ============================================================================

-- USERS: Cada um vê seus próprios dados. Admin vê todos.
DROP POLICY IF EXISTS "Users select own" ON public.users;
CREATE POLICY "Users select own" ON public.users
  FOR SELECT USING (id = public.get_my_id() OR public.is_admin());

DROP POLICY IF EXISTS "Users update own" ON public.users;
CREATE POLICY "Users update own" ON public.users
  FOR UPDATE USING (id = public.get_my_id() OR public.is_admin());

-- SUBJECTS: Todos podem ver ativas. Admin gerencia tudo.
DROP POLICY IF EXISTS "Subjects public read" ON public.subjects;
CREATE POLICY "Subjects public read" ON public.subjects
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Subjects admin manage" ON public.subjects;
CREATE POLICY "Subjects admin manage" ON public.subjects
  FOR ALL USING (public.is_admin());

-- MATERIALS: Todos veem públicos. Donos veem seus. Admin vê tudo.
DROP POLICY IF EXISTS "Materials public read" ON public.materials;
CREATE POLICY "Materials public read" ON public.materials
  FOR SELECT USING (is_public = TRUE OR uploaded_by = public.get_my_id() OR public.is_admin());

DROP POLICY IF EXISTS "Materials insert own" ON public.materials;
CREATE POLICY "Materials insert own" ON public.materials
  FOR INSERT WITH CHECK (uploaded_by = public.get_my_id());

DROP POLICY IF EXISTS "Materials delete own or admin" ON public.materials;
CREATE POLICY "Materials delete own or admin" ON public.materials
  FOR DELETE USING (uploaded_by = public.get_my_id() OR public.is_admin());

-- SIMULATIONS: Todos veem públicos. Criadores veem seus. Admin vê tudo.
DROP POLICY IF EXISTS "Simulations public read" ON public.simulations;
CREATE POLICY "Simulations public read" ON public.simulations
  FOR SELECT USING (is_public = TRUE OR created_by = public.get_my_id() OR public.is_admin());

DROP POLICY IF EXISTS "Simulations insert own" ON public.simulations;
CREATE POLICY "Simulations insert own" ON public.simulations
  FOR INSERT WITH CHECK (created_by = public.get_my_id());

-- ATTEMPTS: Cada um vê suas próprias tentativas. Admin vê todas.
DROP POLICY IF EXISTS "Attempts own only" ON public.attempts;
CREATE POLICY "Attempts own only" ON public.attempts
  FOR ALL USING (user_id = public.get_my_id() OR public.is_admin());

-- CREDIT_TRANSACTIONS: Cada um vê suas. Admin vê todas.
DROP POLICY IF EXISTS "Credits own only" ON public.credit_transactions;
CREATE POLICY "Credits own only" ON public.credit_transactions
  FOR ALL USING (user_id = public.get_my_id() OR public.is_admin());

-- API_KEYS: Apenas admin
DROP POLICY IF EXISTS "API keys admin only" ON public.api_keys;
CREATE POLICY "API keys admin only" ON public.api_keys
  FOR ALL USING (public.is_admin());

-- ADMIN_CONTENTS: Todos veem ativos. Admin gerencia.
DROP POLICY IF EXISTS "Admin contents public read" ON public.admin_contents;
CREATE POLICY "Admin contents public read" ON public.admin_contents
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admin contents admin manage" ON public.admin_contents;
CREATE POLICY "Admin contents admin manage" ON public.admin_contents
  FOR ALL USING (public.is_admin());

-- ============================================================================
-- 5. FUNCTIONS (Stored Procedures)
-- ============================================================================

-- Function: Registrar usuário local com senha hash
CREATE OR REPLACE FUNCTION public.register_local(
  p_email VARCHAR,
  p_password VARCHAR,
  p_name VARCHAR
)
RETURNS JSON AS $$
DECLARE
  v_user_id INTEGER;
BEGIN
  -- Verificar se email já existe
  IF EXISTS (SELECT 1 FROM public.users WHERE email = p_email) THEN
    RETURN json_build_object('success', false, 'error', 'Email já cadastrado');
  END IF;

  -- Criar usuário
  INSERT INTO public.users (email, password, name, credits, plan, last_sign_in_at)
  VALUES (
    p_email,
    crypt(p_password, gen_salt('bf', 10)),
    p_name,
    5,          -- créditos iniciais
    'free',     -- plano gratuito
    NOW()
  )
  RETURNING id INTO v_user_id;

  -- Registrar créditos iniciais
  INSERT INTO public.credit_transactions (user_id, type, amount, description)
  VALUES (v_user_id, 'initial', 5, 'Créditos iniciais gratuitos');

  RETURN json_build_object('success', true, 'user_id', v_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Login local
CREATE OR REPLACE FUNCTION public.login_local(
  p_email VARCHAR,
  p_password VARCHAR
)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
BEGIN
  SELECT * INTO v_user FROM public.users WHERE email = p_email;

  IF v_user IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Email ou senha incorretos');
  END IF;

  IF v_user.blocked THEN
    RETURN json_build_object('success', false, 'error', COALESCE(v_user.block_reason, 'Conta bloqueada'));
  END IF;

  IF v_user.password IS NULL OR v_user.password = '' THEN
    RETURN json_build_object('success', false, 'error', 'Conta sem senha. Use login social.');
  END IF;

  IF v_user.password != crypt(p_password, v_user.password) THEN
    RETURN json_build_object('success', false, 'error', 'Email ou senha incorretos');
  END IF;

  -- Atualizar último login
  UPDATE public.users SET last_sign_in_at = NOW() WHERE id = v_user.id;

  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user.id,
      'name', v_user.name,
      'email', v_user.email,
      'role', v_user.role,
      'credits', v_user.credits,
      'plan', v_user.plan,
      'blocked', v_user.blocked
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Consumir créditos
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id INTEGER,
  p_amount INTEGER,
  p_description VARCHAR DEFAULT 'Uso de créditos'
)
RETURNS JSON AS $$
DECLARE
  v_current INTEGER;
BEGIN
  SELECT credits INTO v_current FROM public.users WHERE id = p_user_id;

  IF v_current < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Créditos insuficientes');
  END IF;

  -- Deduzir créditos
  UPDATE public.users SET credits = credits - p_amount WHERE id = p_user_id;

  -- Registrar transação
  INSERT INTO public.credit_transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'usage', -p_amount, p_description);

  RETURN json_build_object('success', true, 'remaining', v_current - p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Comprar plano (adicionar créditos)
CREATE OR REPLACE FUNCTION public.purchase_plan(
  p_user_id INTEGER,
  p_plan VARCHAR,
  p_credits INTEGER,
  p_description VARCHAR
)
RETURNS JSON AS $$
DECLARE
  v_days INTEGER;
BEGIN
  -- Definir dias baseado no plano
  CASE p_plan
    WHEN 'monthly' THEN v_days := 30;
    WHEN 'semester' THEN v_days := 180;
    WHEN 'annual' THEN v_days := 365;
    ELSE v_days := 30;
  END CASE;

  -- Atualizar usuário
  UPDATE public.users
  SET plan = p_plan,
      credits = credits + p_credits,
      plan_expires_at = COALESCE(plan_expires_at, NOW()) + (v_days || ' days')::INTERVAL,
      blocked = FALSE
  WHERE id = p_user_id;

  -- Registrar transação
  INSERT INTO public.credit_transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'purchase', p_credits, p_description);

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Bloquear usuário (admin)
CREATE OR REPLACE FUNCTION public.block_user(
  p_user_id INTEGER,
  p_reason VARCHAR
)
RETURNS JSON AS $$
BEGIN
  UPDATE public.users SET blocked = TRUE, block_reason = p_reason WHERE id = p_user_id;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Desbloquear usuário (admin)
CREATE OR REPLACE FUNCTION public.unblock_user(p_user_id INTEGER)
RETURNS JSON AS $$
BEGIN
  UPDATE public.users SET blocked = FALSE, block_reason = NULL WHERE id = p_user_id;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Renovar plano (admin)
CREATE OR REPLACE FUNCTION public.renew_plan(
  p_user_id INTEGER,
  p_plan VARCHAR
)
RETURNS JSON AS $$
DECLARE
  v_days INTEGER;
BEGIN
  CASE p_plan
    WHEN 'monthly' THEN v_days := 30;
    WHEN 'semester' THEN v_days := 180;
    WHEN 'annual' THEN v_days := 365;
    ELSE v_days := 30;
  END CASE;

  UPDATE public.users
  SET plan = p_plan,
      plan_expires_at = NOW() + (v_days || ' days')::INTERVAL,
      blocked = FALSE
  WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'expires_at', NOW() + (v_days || ' days')::INTERVAL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Estatísticas do admin
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON AS $$
DECLARE
  v_total_users INTEGER;
  v_total_simulations INTEGER;
  v_total_attempts INTEGER;
  v_total_materials INTEGER;
  v_blocked_users INTEGER;
  v_expired_plans INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_users FROM public.users;
  SELECT COUNT(*) INTO v_total_simulations FROM public.simulations;
  SELECT COUNT(*) INTO v_total_attempts FROM public.attempts;
  SELECT COUNT(*) INTO v_total_materials FROM public.materials;
  SELECT COUNT(*) INTO v_blocked_users FROM public.users WHERE blocked = TRUE;
  SELECT COUNT(*) INTO v_expired_plans FROM public.users WHERE plan != 'free' AND plan_expires_at < NOW();

  RETURN json_build_object(
    'total_users', v_total_users,
    'total_simulations', v_total_simulations,
    'total_attempts', v_total_attempts,
    'total_materials', v_total_materials,
    'blocked_users', v_blocked_users,
    'expired_plans', v_expired_plans
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Trigger: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 7. SEED DATA (Dados Iniciais)
-- ============================================================================

-- 7.1 Matérias/Disciplinas
INSERT INTO public.subjects (name, slug, description, icon, category, is_active) VALUES
  ('Técnico em Radiologia', 'tecnico-radiologia', 'Procedimentos radiológicos, proteção radiológica, anatomia para radiologia e legislação', 'scan', 'Técnico', TRUE),
  ('Técnico em Enfermagem', 'tecnico-enfermagem', 'Cuidados de enfermagem, administração de medicamentos, biossegurança e ética profissional', 'heart-pulse', 'Técnico', TRUE),
  ('Enfermeiro', 'enfermeiro', 'Processo de enfermagem, gestão em saúde, pesquisa e assistência de alta complexidade', 'stethoscope', 'Superior', TRUE),
  ('Sistema Único de Saúde (SUS)', 'sus', 'Legislação do SUS, princípios, organização e políticas de saúde pública', 'shield-plus', 'Legislação', TRUE),
  ('Raciocínio Lógico Matemático', 'raciocinio-logico', 'Lógica proposicional, argumentação, sequências, análise combinatória e probabilidade', 'brain', 'Geral', TRUE),
  ('Matemática', 'matematica', 'Aritmética, álgebra, geometria, trigonometria, estatística e análise matemática', 'calculator', 'Geral', TRUE),
  ('Redação', 'redacao', 'Técnicas de redação, coesão, coerência, tipologia textual e normas cultas', 'pen-tool', 'Geral', TRUE),
  ('Português', 'portugues', 'Gramática, interpretação de texto, literatura, ortografia e semântica', 'book-open', 'Geral', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 7.2 Administrador Principal (Robson Cordeiro dos Santos)
INSERT INTO public.users (email, password, name, role, credits, plan, blocked, last_sign_in_at, created_at, updated_at)
VALUES (
  'robsoncordeiro1966@gmail.com',
  crypt('Binho2020@#$', gen_salt('bf', 10)),
  'Robson Cordeiro dos Santos',
  'admin',
  9999,
  'annual',
  FALSE,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  credits = EXCLUDED.credits,
  plan = EXCLUDED.plan,
  blocked = FALSE,
  updated_at = NOW();

-- 7.3 Registrar créditos iniciais do admin
INSERT INTO public.credit_transactions (user_id, type, amount, description)
SELECT id, 'initial', 9999, 'Créditos iniciais do administrador'
FROM public.users WHERE email = 'robsoncordeiro1966@gmail.com'
ON CONFLICT DO NOTHING;

-- 7.4 Exemplos de Materiais Oficiais (opcional - pode remover se quiser)
-- INSERT INTO public.materials (title, file_url, file_size, mime_type, subject_id, is_public, is_official, created_at)
-- SELECT 'Apostila de Radiologia - Prova 2025', 'https://exemplo.com/radiologia.pdf', 5242880, 'application/pdf', id, TRUE, TRUE, NOW()
-- FROM public.subjects WHERE slug = 'tecnico-radiologia';

-- ============================================================================
-- 8. VIEWS (Visões para facilitar consultas)
-- ============================================================================

-- View: Resumo do usuário com estatísticas
CREATE OR REPLACE VIEW public.v_user_stats AS
SELECT
  u.id,
  u.name,
  u.email,
  u.role,
  u.credits,
  u.plan,
  u.plan_expires_at,
  u.blocked,
  u.block_reason,
  COALESCE(a.total_attempts, 0) AS total_attempts,
  COALESCE(a.avg_score, 0) AS avg_score,
  COALESCE(m.total_materials, 0) AS total_materials_uploaded
FROM public.users u
LEFT JOIN (
  SELECT user_id, COUNT(*) AS total_attempts, AVG(score) AS avg_score
  FROM public.attempts
  GROUP BY user_id
) a ON a.user_id = u.id
LEFT JOIN (
  SELECT uploaded_by, COUNT(*) AS total_materials
  FROM public.materials
  GROUP BY uploaded_by
) m ON m.uploaded_by = u.id;

-- View: Simulados com informações da matéria
CREATE OR REPLACE VIEW public.v_simulations_detail AS
SELECT
  s.id,
  s.title,
  s.type,
  s.questions,
  s.config,
  s.is_public,
  s.credit_cost,
  s.created_at,
  sub.name AS subject_name,
  sub.slug AS subject_slug,
  u.name AS creator_name
FROM public.simulations s
LEFT JOIN public.subjects sub ON sub.id = s.subject_id
LEFT JOIN public.users u ON u.id = s.created_by;

-- View: Ranking de alunos por desempenho
CREATE OR REPLACE VIEW public.v_student_ranking AS
SELECT
  u.id,
  u.name,
  COUNT(a.id) AS attempts_count,
  ROUND(AVG(a.score)::numeric, 2) AS avg_score,
  MAX(a.score) AS best_score,
  SUM(a.correct_count) AS total_correct
FROM public.users u
JOIN public.attempts a ON a.user_id = u.id
WHERE a.completed_at IS NOT NULL AND u.role = 'user'
GROUP BY u.id, u.name
ORDER BY avg_score DESC;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
-- Para verificar se tudo foi criado corretamente, execute:
-- SELECT * FROM public.get_admin_stats();
-- SELECT * FROM public.subjects;
-- SELECT * FROM public.users WHERE role = 'admin';
-- ============================================================================
