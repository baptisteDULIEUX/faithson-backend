import { Router } from 'express'
import { query } from '../db.js'
import { requireAdmin } from '../middlewares/requireAdmin.js'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'

const router = Router()
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

const uploadDir = 'uploads/products'
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase()
        cb(null, `product-${req.params.id}-${Date.now()}${ext}`)
    }
})

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp']
        const ext = path.extname(file.originalname).toLowerCase()
        allowed.includes(ext) ? cb(null, true) : cb(new Error('Format non supporté.'))
    },
    limits: { fileSize: 5 * 1024 * 1024 }
})

// Récupérer toutes les images d'un produit
router.get('/products/:id/images', wrap(async (req, res) => {
    const { rows } = await query(
        'SELECT * FROM product_images WHERE product_id = $1 ORDER BY position ASC',
        [req.params.id]
    )
    res.json(rows)
}))

// Ajouter une image
router.post('/admin/products/:id/images', requireAdmin, upload.single('image'), wrap(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu.' })
    const imagePath = `/uploads/products/${req.file.filename}`

    // position = dernière + 1
    const { rows: pos } = await query(
        'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM product_images WHERE product_id = $1',
        [req.params.id]
    )

    const { rows } = await query(
        'INSERT INTO product_images (product_id, path, position) VALUES ($1, $2, $3) RETURNING *',
        [req.params.id, imagePath, pos[0].next]
    )
    res.json(rows[0])
}))

// Supprimer une image
router.delete('/admin/products/images/:imageId', requireAdmin, wrap(async (req, res) => {
    const { rows } = await query(
        'DELETE FROM product_images WHERE id = $1 RETURNING *',
        [req.params.imageId]
    )
    if (!rows.length) return res.status(404).json({ error: 'Image introuvable.' })

    // supprime le fichier physique
    const filePath = '.' + rows[0].path
    fs.unlink(filePath, () => {})

    res.json({ ok: true })
}))

// Réordonner les images
router.patch('/admin/products/:id/images/reorder', requireAdmin, wrap(async (req, res) => {
    const { order } = req.body // [{ id, position }]
    if (!Array.isArray(order)) return res.status(400).json({ error: 'Format invalide.' })
    for (const { id, position } of order) {
        await query('UPDATE product_images SET position = $1 WHERE id = $2', [position, id])
    }
    res.json({ ok: true })
}))

export default router