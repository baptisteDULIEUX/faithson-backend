import nodemailer from 'nodemailer'
import { config } from '../config.js'

const transporter = nodemailer.createTransport({
    host:   config.mail.host,
    port:   config.mail.port,
    secure: config.mail.secure,
    auth: {
        user: config.mail.user,
        pass: config.mail.pass
    }
})

// Vérifie la connexion SMTP au démarrage du serveur
export async function verifyMailer() {
    try {
        await transporter.verify()
        console.log('✓ Connexion SMTP OK')
    } catch (err) {
        console.warn('⚠ SMTP non disponible :', err.message)
    }
}

// ─── Templates ───────────────────────────────────────────

export async function sendContactMail({ nom, email, message }) {
    await transporter.sendMail({
        from:    `"Faithson Custom" <${config.mail.from}>`,
        to:      config.mail.to,
        replyTo: email,
        subject: `Nouveau message de ${nom}`,
        html: `
      <h2>Nouveau message de contact</h2>
      <p><strong>Nom :</strong> ${nom}</p>
      <p><strong>Email :</strong> ${email}</p>
      <p><strong>Message :</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `
    })
}

export async function sendQuoteMail({ produit, quantite, technique, message, email }) {
    await transporter.sendMail({
        from:    `"Faithson Custom" <${config.mail.from}>`,
        to:      config.mail.to,
        replyTo: email || config.mail.to,
        subject: `Nouvelle demande de devis — ${produit}`,
        html: `
      <h2>Nouvelle demande de devis</h2>
      <p><strong>Produit :</strong> ${produit}</p>
      <p><strong>Quantité :</strong> ${quantite}</p>
      <p><strong>Technique :</strong> ${technique}</p>
      <p><strong>Email :</strong> ${email || '—'}</p>
      <p><strong>Message :</strong></p>
      <p>${(message || '').replace(/\n/g, '<br>')}</p>
    `
    })
}

export async function sendCustomRequestMail({ client, email, garment, technique, placement, qty, note, logoName }) {
    await transporter.sendMail({
        from:    `"Faithson Custom" <${config.mail.from}>`,
        to:      config.mail.to,
        replyTo: email,
        subject: `Nouvelle personnalisation — ${client}`,
        html: `
      <h2>Nouvelle demande de personnalisation</h2>
      <p><strong>Client :</strong> ${client}</p>
      <p><strong>Email :</strong> ${email}</p>
      <p><strong>Vêtement :</strong> ${garment}</p>
      <p><strong>Technique :</strong> ${technique}</p>
      <p><strong>Emplacement :</strong> ${placement}</p>
      <p><strong>Quantité :</strong> ${qty}</p>
      <p><strong>Logo fourni :</strong> ${logoName || '—'}</p>
      <p><strong>Précisions :</strong></p>
      <p>${(note || '').replace(/\n/g, '<br>')}</p>
    `
    })
}