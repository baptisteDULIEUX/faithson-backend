-- =========================================================
--  Faithson Custom — schéma PostgreSQL
--  Idempotent : peut être ré-exécuté sans casser l'existant.
-- =========================================================

-- Catégories de produits (table de référence)
CREATE TABLE IF NOT EXISTS categories (
  key   TEXT PRIMARY KEY,          -- ex : 'hauts'
  label TEXT NOT NULL              -- ex : 'Hauts'
);

-- Produits de la boutique
CREATE TABLE IF NOT EXISTS products (
  id                 TEXT PRIMARY KEY,                 -- slug lisible, ex : 'tshirt-bio'
  name               TEXT NOT NULL,
  technique          TEXT NOT NULL DEFAULT 'sérigraphie',
  category_key       TEXT NOT NULL REFERENCES categories(key)
                       ON UPDATE CASCADE ON DELETE RESTRICT,
  price              NUMERIC(10, 2),                   -- NULL => « sur devis »
  badge              TEXT,                             -- ex : 'Best-seller' (ou NULL)
  image              TEXT,                             -- nom du fichier image (ou NULL)
  placeholder_shape  TEXT NOT NULL DEFAULT 'tshirt',   -- forme du placeholder
  placeholder_color  TEXT NOT NULL DEFAULT '#3a2e27',  -- couleur du placeholder
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- garde-fous de cohérence
  CONSTRAINT price_positive CHECK (price IS NULL OR price >= 0)
);

-- Recherche/filtre par catégorie plus rapide
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_key);

-- Met à jour automatiquement updated_at à chaque UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated ON products;
CREATE TRIGGER trg_products_updated
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
