import { Router } from 'express'
import { query } from '../db.js'
import { requireAdmin } from '../middlewares/requireAdmin.js'

const router = Router()
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// Liste toutes les commandes
router.get('/admin/orders', requireAdmin, wrap(async (req, res) => {
    const { rows } = await query(
        'SELECT * FROM orders ORDER BY created_at DESC'
    )
    res.json(rows)
}))

// Créer une commande (appelé après paiement Stripe)
router.post('/orders', wrap(async (req, res) => {
    const { customer, shipping, items, total } = req.body
    const { rows } = await query(
        `INSERT INTO orders (client, email, product, technique, qty, amount)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
        [
            `${customer.prenom} ${customer.nom}`,
            customer.email,
            items.map((i) => i.name).join(', '),
            items.map((i) => i.technique).filter(Boolean).join(', '),
            items.reduce((n, i) => n + i.qty, 0),
            total
        ]
    )
    res.json({ ok: true, orderId: `#${rows[0].id}` })
}))

// Mettre à jour le statut d'une commande
router.patch('/admin/orders/:id', requireAdmin, wrap(async (req, res) => {
    const { status } = req.body
    const { rows } = await query(
        `UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
        [status, req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Commande introuvable.' })
    res.json(rows[0])
}))

export default router