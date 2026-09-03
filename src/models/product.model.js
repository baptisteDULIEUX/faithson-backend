import { query } from '../db.js'

/* ---------- helpers ---------- */

// transforme une ligne SQL en objet attendu par le frontend
function toApi(row) {
  const price = row.price === null ? null : Number(row.price)
  return {
    id: row.id,
    name: row.name,
    technique: row.technique,
    category: row.category_key,
    price,
    priceLabel: price === null ? 'sur' : 'à partir de',
    badge: row.badge,
    image: row.image,
    placeholder: { shape: row.placeholder_shape, color: row.placeholder_color }
  }
}

// génère un slug propre à partir d'un texte
function slugify(s) {
  return (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function idExists(id) {
  const { rowCount } = await query('SELECT 1 FROM products WHERE id = $1', [id])
  return rowCount > 0
}

/* ---------- opérations ---------- */

export async function findAll({ category } = {}) {
  let sql = 'SELECT * FROM products'
  const params = []
  if (category && category !== 'all') {
    params.push(category)
    sql += ' WHERE category_key = $1'
  }
  sql += ' ORDER BY created_at ASC'
  const { rows } = await query(sql, params)
  return rows.map(toApi)
}

export async function findById(id) {
  const { rows } = await query('SELECT * FROM products WHERE id = $1', [id])
  return rows[0] ? toApi(rows[0]) : null
}

export async function create(data) {
  // id unique dérivé du nom (ou de l'id fourni)
  const base = slugify(data.id || data.name || 'produit') || 'produit'
  let id = base
  let n = 2
  while (await idExists(id)) id = `${base}-${n++}`

  const ph = data.placeholder || {}
  const price = data.price === undefined ? null : data.price

  const { rows } = await query(
    `INSERT INTO products
       (id, name, technique, category_key, price, badge, image, placeholder_shape, placeholder_color)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      id,
      data.name || 'Nouveau produit',
      data.technique || 'sérigraphie',
      data.category || 'hauts',
      price,
      data.badge || null,
      data.image || null,
      ph.shape || 'tshirt',
      ph.color || '#3a2e27'
    ]
  )
  return toApi(rows[0])
}

export async function update(id, patch) {
  const fields = []
  const values = []
  let i = 1

  const simple = { name: 'name', technique: 'technique', price: 'price', badge: 'badge', image: 'image' }
  for (const [key, col] of Object.entries(simple)) {
    if (patch[key] !== undefined) {
      fields.push(`${col} = $${i++}`)
      values.push(patch[key])
    }
  }
  if (patch.category !== undefined) {
    fields.push(`category_key = $${i++}`)
    values.push(patch.category)
  }
  if (patch.placeholder && typeof patch.placeholder === 'object') {
    if (patch.placeholder.shape !== undefined) {
      fields.push(`placeholder_shape = $${i++}`)
      values.push(patch.placeholder.shape)
    }
    if (patch.placeholder.color !== undefined) {
      fields.push(`placeholder_color = $${i++}`)
      values.push(patch.placeholder.color)
    }
  }

  if (fields.length === 0) return findById(id) // rien à modifier

  values.push(id)
  const { rows } = await query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  )
  return rows[0] ? toApi(rows[0]) : null
}

export async function remove(id) {
  const { rowCount } = await query('DELETE FROM products WHERE id = $1', [id])
  return rowCount > 0
}

// liste des catégories (utile pour un futur écran d'admin)
export async function findCategories() {
  const { rows } = await query('SELECT key, label FROM categories ORDER BY label')
  return rows
}
