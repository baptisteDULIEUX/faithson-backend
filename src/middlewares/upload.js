import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'

// Dossier images produits
const productUploadDir = 'uploads/products'
fs.mkdirSync(productUploadDir, { recursive: true })

// Dossier fichiers devis (logos clients)
const quoteUploadDir = 'uploads/quotes'
fs.mkdirSync(quoteUploadDir, { recursive: true })

const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.pdf', '.ai']

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowedExts.includes(ext)) {
        cb(null, true)
    } else {
        cb(new Error('Format non supporté.'))
    }
}

// Upload image produit
const productStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, productUploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase()
        cb(null, `product-${req.params.id}-${Date.now()}${ext}`)
    }
})

// Upload fichier devis
const quoteStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, quoteUploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase()
        cb(null, `quote-${Date.now()}${ext}`)
    }
})

export const uploadImage = multer({
    storage: productStorage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
})

export const uploadQuoteFile = multer({
    storage: quoteStorage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 Mo pour les fichiers vectoriels
})

// Dossier logos personnalisation
const customUploadDir = 'uploads/custom'
fs.mkdirSync(customUploadDir, { recursive: true })

const customStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, customUploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase()
        cb(null, `custom-${Date.now()}${ext}`)
    }
})

export const uploadCustomLogo = multer({
    storage: customStorage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
})