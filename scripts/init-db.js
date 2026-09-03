/* Initialise la base : exécute sql/schema.sql puis sql/seed.sql.
   Usage :
     node scripts/init-db.js            (crée + remplit, sans casser l'existant)
     node scripts/init-db.js --reset    (supprime les tables puis recrée + remplit)
*/
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from '../src/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlDir = path.join(__dirname, '..', 'sql')
const reset = process.argv.includes('--reset')

async function runFile(name) {
  const sql = await fs.readFile(path.join(sqlDir, name), 'utf8')
  await pool.query(sql)
}

async function main() {
  try {
    if (reset) {
      console.log('↻ Suppression des tables…')
      await pool.query('DROP TABLE IF EXISTS products; DROP TABLE IF EXISTS categories;')
    }
    console.log('→ Création du schéma (schema.sql)…')
    await runFile('schema.sql')
    console.log('→ Insertion des données (seed.sql)…')
    await runFile('seed.sql')

    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM products')
    console.log(`✓ Base prête. ${rows[0].n} produits en base.`)
  } catch (err) {
    console.error('✗ Échec de l’initialisation :', err.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

main()
