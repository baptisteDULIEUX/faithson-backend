import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: Number(process.env.PORT) || 3000,
  // si DATABASE_URL est absent, le driver pg utilisera les variables PGHOST/PGUSER/...
  databaseUrl: process.env.DATABASE_URL || null,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  adminApiKey: process.env.ADMIN_API_KEY || null,

  mail: {
    to:     process.env.MAIL_TO   || 'contact@faithson.fr',
    from:   process.env.MAIL_FROM || 'noreply@faithson.fr',
    host:   process.env.SMTP_HOST || 'ssl0.ovh.net',
    port:   Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE !== 'false',
    user:   process.env.SMTP_USER || '',
    pass:   process.env.SMTP_PASS || ''
  }
}
