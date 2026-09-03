import * as Product from '../models/product.model.js'

// petit wrapper pour capturer les erreurs async et les passer au gestionnaire d'erreurs
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

const CATEGORIES = ['hauts', 'accessoires', 'pro']

function validate(body, { partial = false } = {}) {
  const errors = []
  if (!partial || body.name !== undefined) {
    if (!body.name || !String(body.name).trim()) errors.push('Le nom est obligatoire.')
  }
  if (body.category !== undefined && !CATEGORIES.includes(body.category)) {
    errors.push(`Catégorie invalide (attendu : ${CATEGORIES.join(', ')}).`)
  }
  if (body.price !== undefined && body.price !== null) {
    const n = Number(body.price)
    if (Number.isNaN(n) || n < 0) errors.push('Le prix doit être un nombre positif ou null.')
  }
  return errors
}

export const list = wrap(async (req, res) => {
  const products = await Product.findAll({ category: req.query.category })
  res.json(products)
})

export const getOne = wrap(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) return res.status(404).json({ error: 'Produit introuvable.' })
  res.json(product)
})

export const create = wrap(async (req, res) => {
  const errors = validate(req.body)
  if (errors.length) return res.status(400).json({ errors })
  const product = await Product.create(req.body)
  res.status(201).json(product)
})

export const update = wrap(async (req, res) => {
  const errors = validate(req.body, { partial: true })
  if (errors.length) return res.status(400).json({ errors })
  const product = await Product.update(req.params.id, req.body)
  if (!product) return res.status(404).json({ error: 'Produit introuvable.' })
  res.json(product)
})

export const remove = wrap(async (req, res) => {
  const ok = await Product.remove(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Produit introuvable.' })
  res.status(204).end()
})

export const categories = wrap(async (req, res) => {
  res.json(await Product.findCategories())
})
