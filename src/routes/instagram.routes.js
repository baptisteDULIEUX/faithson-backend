import { Router } from 'express'
import { query } from '../db.js'
import { requireAdmin } from '../middlewares/requireAdmin.js'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'

const router = Router()
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

const uploadDir = 'uploads/instagram'
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase()
        cb(null, `post-${Date.now()}${ext}`)
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

// Public — liste tous les posts
router.get('/instagram', wrap(async (req, res) => {
    const { rows } = await query(
        'SELECT * FROM instagram_posts ORDER BY position ASC, created_at DESC'
    )
    res.json(rows)
}))

// Admin — ajouter un post
router.post('/admin/instagram', requireAdmin, upload.single('image'), wrap(async (req, res) => {
    const { caption, link, featured } = req.body
    const imagePath = req.file ? `/uploads/instagram/${req.file.filename}` : null

    const { rows: pos } = await query(
        'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM instagram_posts'
    )

    const { rows } = await query(
        `INSERT INTO instagram_posts (caption, image_path, link, featured, position)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [caption || null, imagePath, link || null, featured === 'true', pos[0].next]
    )
    res.json(rows[0])
}))

// Admin — modifier un post
router.patch('/admin/instagram/:id', requireAdmin, upload.single('image'), wrap(async (req, res) => {
    const { caption, link, featured } = req.body
    const imagePath = req.file ? `/uploads/instagram/${req.file.filename}` : undefined

    const fields = []
    const values = []
    let i = 1

    if (caption !== undefined) { fields.push(`caption = $${i++}`); values.push(caption) }
    if (link !== undefined) { fields.push(`link = $${i++}`); values.push(link) }
    if (featured !== undefined) { fields.push(`featured = $${i++}`); values.push(featured === 'true') }
    if (imagePath !== undefined) { fields.push(`image_path = $${i++}`); values.push(imagePath) }

    if (!fields.length) return res.status(400).json({ error: 'Rien à modifier.' })

    values.push(req.params.id)
    const { rows } = await query(
        `UPDATE instagram_posts SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
        values
    )
    res.json(rows[0])
}))

// Admin — supprimer un post
router.delete('/admin/instagram/:id', requireAdmin, wrap(async (req, res) => {
    const { rows } = await query(
        'DELETE FROM instagram_posts WHERE id = $1 RETURNING *',
        [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Post introuvable.' })
    if (rows[0].image_path) fs.unlink('.' + rows[0].image_path, () => {})
    res.json({ ok: true })
}))

// Admin — réordonner
router.patch('/admin/instagram/reorder', requireAdmin, wrap(async (req, res) => {
    const { order } = req.body
    if (!Array.isArray(order)) return res.status(400).json({ error: 'Format invalide.' })
    for (const { id, position } of order) {
        await query('UPDATE instagram_posts SET position = $1 WHERE id = $2', [position, id])
    }
    res.json({ ok: true })
}))

export default router