-- ─── TABELA DE ITENS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  photo_url TEXT,
  purchase_date TEXT NOT NULL,
  purchase_price NUMERIC NOT NULL,
  condition TEXT NOT NULL,
  supplier TEXT,
  status TEXT NOT NULL,
  suggested_price NUMERIC NOT NULL,
  created_at TEXT NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso público para leitura/escrita rápida (para fins de testes/aplicações locais privadas)
CREATE POLICY "Acesso público completo para items" ON items 
  FOR ALL USING (true) WITH CHECK (true);


-- ─── TABELA DE VENDAS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  item_id TEXT REFERENCES items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  item_category TEXT NOT NULL,
  sale_price NUMERIC NOT NULL,
  purchase_price NUMERIC NOT NULL,
  delivery_method TEXT NOT NULL,
  delivery_cost NUMERIC DEFAULT 0,
  profit NUMERIC NOT NULL,
  margin_percent NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  buyer TEXT,
  sale_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  photo_url TEXT
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso público
CREATE POLICY "Acesso público completo para sales" ON sales 
  FOR ALL USING (true) WITH CHECK (true);


-- ─── TABELA DE CONFIGURAÇÕES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso público
CREATE POLICY "Acesso público completo para settings" ON settings 
  FOR ALL USING (true) WITH CHECK (true);

-- Inserir configurações padrão
INSERT INTO settings (key, value)
VALUES 
  ('defaultMargin', '50'),
  ('storeName', 'Minha Loja'),
  ('userName', 'Francisco'),
  -- Inicializa o usuário administrador principal (senha padrão: giro123)
  ('user_gilbertofreire624@gmail.com', '{"email":"gilbertofreire624@gmail.com","role":"admin","passwordHash":"953503f8e02d99d3e8ad4a6ff417038e3e4a29a4a7541ef4177d6ad8565a9e33"}')
ON CONFLICT (key) DO NOTHING;


-- ─── TABELA DE USUÁRIOS (OPCIONAL/FUTURA) ──────────────────────────────────────
-- Esta tabela é opcional porque as credenciais já rodam de forma auto-suficiente
-- na tabela 'settings' para evitar erros de migração na inicialização.
-- Caso queira organizar futuramente, você pode executar o bloco abaixo:
/*
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso público completo para users" ON users 
  FOR ALL USING (true) WITH CHECK (true);

INSERT INTO users (id, email, password, role, created_at)
VALUES (
  'admin-default-id', 
  'gilbertofreire624@gmail.com', 
  '953503f8e02d99d3e8ad4a6ff417038e3e4a29a4a7541ef4177d6ad8565a9e33', -- giro123
  'admin', 
  '2026-07-13T09:10:00-03:00'
) ON CONFLICT (email) DO NOTHING;
*/

