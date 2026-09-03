import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import productsRouter from './routes/products.routes.js'

const app = express()

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

app.listen(config.port, () => {
  console.log(`API Faithson démarrée sur http://localhost:${config.port}`)
  console.log(`→ test : http://localhost:${config.port}/api/products`)
})
