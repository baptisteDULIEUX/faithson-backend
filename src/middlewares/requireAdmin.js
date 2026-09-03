import { config } from '../config.js'

/* Protection simple des routes admin par clé d'API.
   - Si ADMIN_API_KEY est vide (dev) : accès libre.
   - Sinon : il faut l'en-tête  x-admin-key: <valeur>

   ⚠️ Étape suivante recommandée : remplacer par une vraie
   authentification (login + JWT) côté serveur, en lien avec
   le store d'auth du frontend. */
export function requireAdmin(req, res, next) {
  if (!config.adminApiKey) return next()
  const key = req.get('x-admin-key')
  if (key && key === config.adminApiKey) return next()
  return res.status(401).json({ error: 'Non autorisé.' })
}
