import { Router } from 'express'
import { sendContactMail, sendQuoteMail, sendCustomRequestMail } from '../services/mailer.js'
import { uploadQuoteFile } from '../middlewares/upload.js'
import { query } from '../db.js'

const router = Router()

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// Contact
router.post('/contact', wrap(async (req, res) => {
    const { nom, email, message } = req.body
    if (!nom || !email || !message) {
        return res.status(400).json({ error: 'Nom, email et message sont obligatoires.' })
    }
    await sendContactMail({ nom, email, message })
    res.json({ ok: true })
}))

// Devis (avec upload fichier optionnel)
router.post('/quotes', uploadQuoteFile.single('fichier'), wrap(async (req, res) => {
    const { produit, quantite, technique, message, email } = req.body
    if (!produit) {
        return res.status(400).json({ error: 'Le produit est obligatoire.' })
    }

    const fichierUrl = req.file ? `/uploads/quotes/${req.file.filename}` : null

    // Stockage en base
    const { rows } = await query(
        `INSERT INTO quotes (produit, quantite, technique, message, email, fichier)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
        [produit, quantite || null, technique || null, message || null, email || null, fichierUrl]
    )

    // Envoi mail
    await sendQuoteMail({ produit, quantite, technique, message, email, fichierUrl })

    res.json({ ok: true, quoteId: `DEVIS-${rows[0].id}` })
}))

// Personnalisation
router.post('/custom-requests', wrap(async (req, res) => {
    const { client, email, garment, technique, placement, qty, note, logoName } = req.body
    if (!client || !email) {
        return res.status(400).json({ error: 'Nom et email sont obligatoires.' })
    }
    await sendCustomRequestMail({ client, email, garment, technique, placement, qty, note, logoName })
    res.json({ ok: true, requestId: 'PERSO-' + Date.now() })
}))

// ── Routes admin ──────────────────────────────────────────

// Liste tous les devis
router.get('/admin/quotes', wrap(async (req, res) => {
    const { rows } = await query(
        'SELECT * FROM quotes ORDER BY created_at DESC'
    )
    res.json(rows)
}))

// Mettre à jour le statut et/ou proposer un montant
router.patch('/admin/quotes/:id', wrap(async (req, res) => {
    const { statut, montant_propose } = req.body
    const { rows } = await query(
        `UPDATE quotes
     SET statut = COALESCE($1, statut),
         montant_propose = COALESCE($2, montant_propose),
         updated_at = now()
     WHERE id = $3
     RETURNING *`,
        [statut || null, montant_propose || null, req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Devis introuvable.' })
    res.json(rows[0])
}))

export default router