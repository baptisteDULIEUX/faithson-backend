import { Router } from 'express'
import { query } from '../db.js'
import { requireAdmin } from '../middlewares/requireAdmin.js'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'

const router = Router()
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

const uploadDir = 'uploads/settings'
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase()
        cb(null, `hero-${Date.now()}${ext}`)
    }
})

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp']
        const ext = path.extname(file.originalname).toLowerCase()
        allowed.includes(ext) ? cb(null, true) : cb(new Error('Format non supporté.'))
    },
    limits: { fileSize: 10 * 1024 * 1024 }
})

// Public — récupérer tous les settings
router.get('/settings', wrap(async (req, res) => {
    const { rows } = await query('SELECT key, value FROM settings')
    const settings = {}
    rows.forEach((r) => { settings[r.key] = r.value })
    res.json(settings)
}))

// Admin — mettre à jour un setting texte
router.patch('/admin/settings', requireAdmin, wrap(async (req, res) => {
    const { key, value } = req.body
    if (!key) return res.status(400).json({ error: 'Clé obligatoire.' })
    await query(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
        [key, value]
    )
    res.json({ ok: true, key, value })
}))

// Admin — uploader l'image hero
router.post('/admin/settings/hero-image', requireAdmin, upload.single('image'), wrap(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu.' })
    const imagePath = `/uploads/settings/${req.file.filename}`
    await query(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
        ['hero_image', imagePath]
    )
    res.json({ ok: true, path: imagePath })
}))

export default router