import { Router } from 'express'
import { query } from '../db.js'
import { requireAdmin } from '../middlewares/requireAdmin.js'
import { uploadCustomLogo } from '../middlewares/upload.js'
import { sendCustomRequestMail } from '../services/mailer.js'

const router = Router()
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// Client soumet une demande de personnalisation
router.post('/custom-requests', uploadCustomLogo.single('logo'), wrap(async (req, res) => {
    const { client, email, garment, garmentColor, technique, placement, qty, note } = req.body

    if (!client || !email) {
        return res.status(400).json({ error: 'Nom et email sont obligatoires.' })
    }

    const logoPath = req.file ? `/uploads/custom/${req.file.filename}` : null

    const { rows } = await query(
        `INSERT INTO custom_requests
       (client, email, garment, garment_color, technique, placement, qty, note, logo_path)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id`,
        [client, email, garment, garmentColor, technique, placement, qty || null, note, logoPath]
    )

    // Mail non bloquant
    sendCustomRequestMail({
        client, email, garment, technique, placement,
        qty, note, logoName: req.file?.originalname
    }).catch((err) => console.warn('Mail non envoyé :', err.message))

    res.json({ ok: true, requestId: `PERSO-${rows[0].id}` })
}))

// Admin — liste toutes les demandes
router.get('/admin/custom-requests', requireAdmin, wrap(async (req, res) => {
    const { rows } = await query(
        'SELECT * FROM custom_requests ORDER BY created_at DESC'
    )
    res.json(rows)
}))

// Admin — mettre à jour statut et/ou prix proposé
router.patch('/admin/custom-requests/:id', requireAdmin, wrap(async (req, res) => {
    const { status, proposed_price } = req.body
    const { rows } = await query(
        `UPDATE custom_requests
     SET status = COALESCE($1, status),
         proposed_price = COALESCE($2, proposed_price),
         updated_at = now()
     WHERE id = $3
     RETURNING *`,
        [status || null, proposed_price || null, req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Demande introuvable.' })
    res.json(rows[0])
}))

export default router