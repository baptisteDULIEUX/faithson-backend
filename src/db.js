import pg from 'pg'
import { config } from './config.js'

const { Pool } = pg

// Si DATABASE_URL est fourni on l'utilise, sinon pg lit les variables PG* de l'environnement.
export const pool = new Pool(
  config.databaseUrl ? { connectionString: config.databaseUrl } : {}
)

pool.on('error', (err) => {
  console.error('Erreur inattendue du pool PostgreSQL :', err)
})

// petit raccourci pour les requêtes paramétrées
export function query(text, params) {
  return pool.query(text, params)
}
