import { Router } from 'express'
import { sendContactMail, sendQuoteMail, sendCustomRequestMail } from '../services/mailer.js'

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

// Devis
router.post('/quotes', wrap(async (req, res) => {
    const { produit, quantite, technique, message, email } = req.body
    if (!produit) {
        return res.status(400).json({ error: 'Le produit est obligatoire.' })
    }
    await sendQuoteMail({ produit, quantite, technique, message, email })
    res.json({ ok: true, quoteId: 'DEVIS-' + Date.now() })
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

export default router