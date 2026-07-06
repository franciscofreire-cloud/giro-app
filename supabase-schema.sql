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
  ('userName', 'Francisco')
ON CONFLICT (key) DO NOTHING;
