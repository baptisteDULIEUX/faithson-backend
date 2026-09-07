import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'

// Crée le dossier si il n'existe pas
const uploadDir = 'uploads/products'
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase()
        const name = `product-${req.params.id}-${Date.now()}${ext}`
        cb(null, name)
    }
})

const fileFilter = (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
        cb(null, true)
    } else {
        cb(new Error('Format non supporté. Utilisez JPG, PNG ou WebP.'))
    }
}

export const uploadImage = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 Mo max
})