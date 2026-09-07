import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import productsRouter from './routes/products.routes.js'
import Stripe from 'stripe'

import formsRouter from './routes/forms.routes.js'
import {verifyMailer} from "./services/mailer.js"

const app = express()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
// CORS : autorise le frontend (origine(s) définie(s) dans .env)
app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((o) => o.trim())
  })
)
app.use(express.json())

// petit log des requêtes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`)
  next()
})

// santé du service
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'faithson-backend' }))

// routes métier (montées sous /api pour coller à VITE_API_URL du frontend)
app.use('/api', productsRouter)

app.use('/api', formsRouter)

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: req.body.items,
      mode: 'payment',
      // CORRECTION 3 : Utilisation des données client
      customer_email: req.body.customer.email,
      metadata: {
        prenom: req.body.customer.prenom,
        nom: req.body.customer.nom,
        adresse: req.body.shipping.adresse,
        cp: req.body.shipping.cp,
        ville: req.body.shipping.ville
      },

      shipping_address_collection: ['FR'],
      // Ajout de l'ID de session dans l'URL de succès pour pouvoir l'identifier
      success_url: `https://faithson.fr/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://faithson.fr/checkout`,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/checkout-session/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId)
    res.json({
      orderId: session.id,
      customerEmail: session.customer_email,
      customerName: `${session.metadata.prenom} ${session.metadata.nom}`,
      adresse: `${session.metadata.adresse}, ${session.metadata.cp} ${session.metadata.ville}`,
      total: (session.amount_total / 100).toFixed(2),
      currency: session.currency.toUpperCase(),
      status: session.payment_status
    })
  } catch (error) {
    res.status(404).json({ error: 'Session introuvable.' })
  }
})
// 404
app.use((req, res) => res.status(404).json({ error: 'Ressource introuvable.' }))

// gestionnaire d'erreurs central
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err)
  // erreurs PostgreSQL courantes traduites en messages clairs
  if (err.code === '23503') return res.status(400).json({ error: "Catégorie inexistante." })
  if (err.code === '23505') return res.status(409).json({ error: 'Un produit avec cet identifiant existe déjà.' })
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur.' })
})

verifyMailer()

app.listen(config.port, () => {
  console.log(`API Faithson démarrée sur http://localhost:${config.port}`)
  console.log(`→ test : http://localhost:${config.port}/api/products`)
})
