-- =========================================================
--  Données de départ (reprend le catalogue du frontend)
--  Idempotent : ON CONFLICT DO NOTHING => ré-exécutable.
-- =========================================================

INSERT INTO categories (key, label) VALUES
  ('hauts', 'Hauts'),
  ('accessoires', 'Accessoires'),
  ('pro', 'Pro')
ON CONFLICT (key) DO NOTHING;

INSERT INTO products
  (id, name, technique, category_key, price, badge, image, placeholder_shape, placeholder_color)
VALUES
  ('tshirt-bio',     'T-shirt coton bio',   'sérigraphie',    'hauts',       12, 'Best-seller', NULL, 'tshirt', '#3a2e27'),
  ('sweat-capuche',  'Sweat à capuche',     'flocage',        'hauts',       29, NULL,          NULL, 'hoodie', '#7c8b5a'),
  ('polo-brode',     'Polo brodé',          'broderie',       'hauts',       22, 'Broderie',    NULL, 'polo',   '#e0a93b'),
  ('totebag',        'Totebag coton',       'sérigraphie',    'accessoires',  8, NULL,          NULL, 'bag',    '#b5482e'),
  ('casquette',      'Casquette',           'broderie',       'accessoires', 14, NULL,          NULL, 'cap',    '#3a2e27'),
  ('vetement-pro',   'Vêtement de travail', 'sur mesure',     'pro',       NULL, 'Pro',         NULL, 'tshirt', '#e0a93b'),
  ('sweat-col-rond', 'Sweat col rond',      'flocage',        'hauts',       26, NULL,          NULL, 'tshirt', '#b5482e'),
  ('tapis-souris',   'Tapis de souris',     'impression DTF', 'accessoires',  9, 'Éco',         NULL, 'bag',    '#7c8b5a')
ON CONFLICT (id) DO NOTHING;
