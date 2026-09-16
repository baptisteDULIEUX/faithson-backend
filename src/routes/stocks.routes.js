import { Router } from 'express'
import { query } from '../db.js'
import { requireAdmin } from '../middlewares/requireAdmin.js'

const router = Router()
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// Récupérer le stock d'un produit
router.get('/products/:id/stock', wrap(async (req, res) => {
    const { rows } = await query(
        'SELECT size, quantity FROM stocks WHERE product_id = $1 ORDER BY size',
        [req.params.id]
    )
    res.json(rows)
}))

// Mettre à jour le stock d'une taille (admin)
router.put('/admin/products/:id/stock', requireAdmin, wrap(async (req, res) => {
    const { size, quantity } = req.body
    if (!size || quantity === undefined) {
        return res.status(400).json({ error: 'Taille et quantité obligatoires.' })
    }
    const { rows } = await query(
        `INSERT INTO stocks (product_id, size, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (product_id, size)
     DO UPDATE SET quantity = $3
     RETURNING *`,
        [req.params.id, size, Number(quantity)]
    )
    res.json(rows[0])
}))

// Mettre à jour plusieurs tailles d'un coup (admin)
router.put('/admin/products/:id/stocks', requireAdmin, wrap(async (req, res) => {
    const { stocks } = req.body // [{ size, quantity }]
    if (!Array.isArray(stocks)) {
        return res.status(400).json({ error: 'Format invalide.' })
    }
    const results = []
    for (const { size, quantity } of stocks) {
        const { rows } = await query(
            `INSERT INTO stocks (product_id, size, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (product_id, size)
       DO UPDATE SET quantity = $3
       RETURNING *`,
            [req.params.id, size, Number(quantity)]
        )
        results.push(rows[0])
    }
    res.json(results)
}))

// Décrémenter le stock après un achat
router.post('/products/:id/stock/decrement', wrap(async (req, res) => {
    const { size, quantity } = req.body
    if (!size || !quantity) {
        return res.status(400).json({ error: 'Taille et quantité obligatoires.' })
    }
    const { rows } = await query(
        `UPDATE stocks
     SET quantity = GREATEST(0, quantity - $1)
     WHERE product_id = $2 AND size = $3
     RETURNING *`,
        [Number(quantity), req.params.id, size]
    )
    if (!rows.length) return res.status(404).json({ error: 'Stock introuvable.' })
    res.json(rows[0])
}))

export default router