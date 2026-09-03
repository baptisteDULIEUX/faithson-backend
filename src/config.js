import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: Number(process.env.PORT) || 3000,
  // si DATABASE_URL est absent, le driver pg utilisera les variables PGHOST/PGUSER/...
  databaseUrl: process.env.DATABASE_URL || null,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  adminApiKey: process.env.ADMIN_API_KEY || null
}
